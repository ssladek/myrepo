(function() {
  var ImplantModel, InstituteModel, ObjectId, PatientModel, UserModel, apiSenderService, async, changeLogService, configDB, environment, eprdService, getImplantFilter, implantBaseDataService, inspect, patientService, registerConfig, registerType, removeImplant, saveImplant, self, updateLogService;

  inspect = require('eyespect').inspector({
    maxLength: null
  });

  async = require('async');

  environment = require('../config/config.js')();

  registerConfig = require('../config/register-config.js');

  registerType = registerConfig.getType();

  configDB = require('../config/database.js')(environment);

  apiSenderService = require('../api/manager/api-sender.service.js');

  updateLogService = require('../log/update/update-log.service.js');

  changeLogService = require('../log/change/change-log.service.js');

  patientService = require('../patient/patient.service.js');

  implantBaseDataService = require('../implant-base-data/implant-base-data.service.js');

  eprdService = require('../eprd/eprd.service.js');

  InstituteModel = require('../institute/institute.model.js');

  UserModel = require('../user/user.model.js');

  PatientModel = require('../patient/patient.model.js');

  ImplantModel = require('./implant.model.js');

  ObjectId = require('mongoose').Types.ObjectId;

  self = this;

  exports.createUpdateLog = function(appUser, callback) {
    return updateLogService.createLog(appUser, 'local', 'national', 'implants', true, function(err, result) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, true);
    });
  };

  exports.transferImplantsToNationalRegister = function(appUser, lastUpdated, callback) {
    var appUserToken, filter, startDate;
    appUserToken = appUser.token;
    startDate = lastUpdated;
    filter = {};
    if (startDate !== 'none') {
      filter = {
        "$or": [
          {
            "lastSyncedManager": {
              "$gt": startDate
            },
            "lastSyncedManager": null
          }
        ]
      };
    }
    filter.operationFinished = true;
    return ImplantModel.find(filter).distinct('operationId').exec(function(err, operationIds) {
      if (err != null) {
        return callback(err);
      }
      if ((operationIds != null) && operationIds.length > 0) {
        filter = {};
        filter['operationId'] = {};
        filter['operationId']['$in'] = operationIds;
        return ImplantModel.find(filter).lean().exec(function(err, implantsFound) {
          if (err != null) {
            return callback(err);
          }
          if ((implantsFound != null) && implantsFound.length > 0) {
            return apiSenderService.send(environment, 'createOrUpdateImplants', implantsFound, appUserToken, function(err, implantIds) {
              if (err != null) {
                return callback(err);
              }
              return async.each(implantIds, function(implantId, next) {
                return ImplantModel.update({
                  _id: new Object(implantId._id)
                }, {
                  $set: {
                    refId: new Object(implantId.refId),
                    lastSyncedManager: new Date()
                  }
                }, function(err, result) {
                  if (err != null) {
                    return next(err);
                  }
                  return next(null);
                });
              }, function(err) {
                if (err != null) {
                  return callback(err);
                }
                return self.createUpdateLog(appUser, function(err, result) {
                  if (err != null) {
                    return callback(err);
                  }
                  return callback(null, true);
                });
              });
            });
          }
        });
      } else {
        return self.createUpdateLog(appUser, function(err, result) {
          if (err != null) {
            return callback(err);
          }
          return callback(null, 'nothing to transfer');
        });
      }
    });
  };

  saveImplant = function(appUser, implant, method, callback) {
    return async.parallel({
      implantBaseData: function(next) {
        return implantBaseDataService.createImplantBaseData(appUser, implant, next);
      },
      implant: function(next) {
        return implant.save(function(err, result) {
          if (err != null) {
            return next(err);
          }
          return next(null);
        });
      }
    }, function(err, results) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, implant);
    });
  };

  exports.createImplant = function(appUser, implantData, callback) {
    var err, newImplant;
    err = "";
    newImplant = new ImplantModel();
    return async.waterfall([
      function(next) {
        if (implantData.patient != null) {
          newImplant.patient = new ObjectId(implantData.patient);
        } else if (appUser.is('patient')) {

        } else {
          err = "Kein Patient angegeben.";
        }
        if (implantData.bodyPart != null) {
          newImplant.bodyPart = implantData.bodyPart;
        } else {
          err += "Keine Körperregion angegeben.";
        }
        if (implantData.art != null) {
          newImplant.art = implantData.art;
        } else {
          err += "Keine Bezeichnung angegeben.";
        }
        if (implantData.manufacturer != null) {
          newImplant.manufacturer = implantData.manufacturer;
        } else {
          err += "Kein Hersteller angegeben.";
        }
        if (implantData.referenceNr != null) {
          newImplant.referenceNr = implantData.referenceNr;
        } else {
          err += "Keine Referenznummer angegeben.";
        }
        if (implantData.model != null) {
          newImplant.model = implantData.model;
        } else {
          err += "Kein Model angegeben.";
        }
        if (implantData.type != null) {
          newImplant.type = implantData.type;
        } else {
          err += "Kein Typ angegeben.";
        }
        if (implantData.lot != null) {
          newImplant.lot = implantData.lot;
        } else {
          err += "Kein Loscode (Lot) angegeben.";
        }
        if (implantData.serialNr != null) {
          newImplant.serialNr = implantData.serialNr;
        } else {
          err += "Keine Seriennummer angegeben.";
        }
        if (implantData.operationFinished != null) {
          newImplant.operationFinished = implantData.operationFinished;
        } else {
          err += "Fehlende Information ob das Implantat das letzte eine Operationsserie ist.";
        }
        if (implantData.operationId != null) {
          newImplant.operationId = implantData.operationId;
        }
        if (implantData.operationName != null) {
          newImplant.operationName = implantData.operationName;
        }
        if (implantData.materialNr != null) {
          newImplant.materialNr = implantData.materialNr;
        }
        if (implantData.storage != null) {
          newImplant.storage = implantData.storage;
        }
        if (implantData.saveDate != null) {
          newImplant.saveDate = new Date(implantData.saveDate);
        }
        if (implantData.imOrExplant != null) {
          newImplant.imOrExplant = implantData.imOrExplant;
        } else {
          err += "Nicht angegeben ob Im-/ oder Explantat";
        }
        if (implantData.controllDate != null) {
          newImplant.controllDate = new Date(implantData.controllDate);
        }
        if (implantData.comment != null) {
          newImplant.comment = implantData.comment;
        }
        if (implantData.sendToEprd != null) {
          newImplant.sendToEprd = implantData.sendToEprd;
        }
        if (implantData.sendToVitabook != null) {
          newImplant.sendToVitabook = implantData.sendToVitabook;
        }
        if (err !== "") {
          return next(err);
        } else {
          err = null;
        }
        if (appUser.is('superAdmin')) {
          return async.parallel({
            first: function(next) {
              console.log(implantData.newInstitute);
              if (implantData.newInstitute != null) {
                return InstituteModel.findOne({
                  _id: new ObjectId(implantData.newInstitute),
                  deleted: false
                }, function(err, instituteFound) {
                  if (err != null) {
                    return next(err);
                  }
                  if (instituteFound == null) {
                    return next('Klinik-Id unbekannt');
                  }
                  newImplant.institute = implantData.newInstitute;
                  return next(null, instituteFound);
                });
              } else {
                return next('keine Klinik angegeben', null);
              }
            },
            second: function(next) {
              if (implantData.newCreator != null) {
                return UserModel.findOne({
                  _id: new ObjectId(implantData.newCreator),
                  deleted: false
                }, function(err, userFound) {
                  if (err != null) {
                    return next(err);
                  }
                  if (userFound == null) {
                    return next('Benutzer-Id unbekannt');
                  }
                  newImplant.creator = implantData.newCreator;
                  return next(null, userFound);
                });
              } else {
                return next('keinen Ersteller angegeben', null);
              }
            },
            third: function(next) {
              if (implantData.newField != null) {
                newImplant.field = implantData.newField;
                return next(null);
              } else {
                return next('kein Feld angegeben', null);
              }
            }
          }, function(err, results) {
            if (err != null) {
              return next(err);
            }
            return saveImplant(appUser, newImplant, 'createImplant', next);
          });
        } else if (appUser.is('institute')) {
          return UserModel.findOne({
            _id: new ObjectId(implantData.newCreator),
            deleted: false
          }, function(err, userFound) {
            if (err != null) {
              return next(err);
            }
            if (userFound == null) {
              return next('Benutzer-Id unbekannt');
            }
            newImplant.creator = implantData.newCreator;
            newImplant.institute = userFound.institute;
            newImplant.field = userFound.field;
            return saveImplant(appUser, newImplant, 'createImplant', next);
          });
        } else if (appUser.is('employee') || appUser.is('employee-auto')) {
          newImplant.creator = appUser._id;
          newImplant.institute = appUser.institute;
          newImplant.field = appUser.field;
          return saveImplant(appUser, newImplant, 'createImplant', next);
        } else if (appUser.is('patient')) {
          newImplant.creator = appUser._id;
          newImplant.institute = appUser.institute;
          newImplant.field = appUser.field || 'patient';
          return PatientModel.findOne({
            creator: new ObjectId(appUser._id),
            deleted: false
          }, function(err, patient) {
            if (patient === null) {
              return patientService.createPatientFromUser(appUser, function(err, patientId) {
                newImplant.patient = patientId;
                return saveImplant(appUser, newImplant, 'createImplant', next);
              });
            } else {
              newImplant.patient = patient._id;
              return saveImplant(appUser, newImplant, 'createImplant', next);
            }
          });
        } else {
          return next('keine Berechtigung zum erfassen von Implantaten');
        }
      }, function(savedImplant, next) {
        if ((implantData.eprd != null) && Object.keys(implantData.eprd).length > 0) {
          return eprdService.createEprd(appUser, newImplant._id, savedImplant.institute, implantData.eprd, function(err, result) {
            if (err != null) {
              return next(err);
            }
            return next(null, savedImplant);
          });
        } else {
          return next(null, savedImplant);
        }
      }
    ], function(err, savedImplant) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, savedImplant);
    });
  };

  getImplantFilter = function(appUser, filter, callbackGetImplants) {
    var err, operationId;
    if (appUser.is('superAdmin') || appUser.is('national')) {

    } else if (appUser.is('nationalField')) {
      filter.field = appUser.field;
    } else if (appUser.is('institute')) {
      filter.institute = appUser.institute;
    } else if (appUser.is('employee')) {
      filter.field = appUser.field;
      filter.institute = appUser.institute;
    } else if (appUser.is('employee-auto')) {
      if (filter.operationId == null) {
        return callbackGetImplants("Es können nur Implantate mit einer OperationsId abgefragt werden");
      }
      operationId = filter.operationId;
      filter = {};
      filter.field = appUser.field;
      filter.institute = appUser.institute;
      filter.creator = appUser._id;
      filter.operationId = operationId;
    } else if (appUser.is('patient')) {
      filter.creator = appUser._id;
    } else {
      return callbackGetImplants('Keine Berechtigung zum Lesen der Implantate');
    }
    if (filter.lot != null) {
      try {
        filter.lot = new RegExp(filter.lot, "gi");
      } catch (_error) {
        err = _error;
        delete filter.lot;
      }
    }
    if (filter.imOrExplant === "") {
      delete filter.imOrExplant;
    }
    if ((filter.serialMinRange != null) && (filter.serialMaxRange != null)) {
      filter.serialNr = {
        $gte: filter.serialMinRange,
        $lte: filter.serialMaxRange
      };
      delete filter.serialMinRange;
      delete filter.serialMaxRange;
    }
    if ((filter.lotMinRange != null) && (filter.lotMaxRange != null)) {
      filter.lot = {
        $gte: filter.lotMinRange,
        $lte: filter.lotMaxRange
      };
      delete filter.lotMinRange;
      delete filter.lotMaxRange;
    }
    if ((filter.referenceMinRange != null) && (filter.referenceMaxRange != null)) {
      filter.referenceNr = {
        $gte: filter.referenceMinRange,
        $lte: filter.referenceMaxRange
      };
      delete filter.referenceMinRange;
      delete filter.referenceMaxRange;
    }
    if (filter.searchIntervall != null) {
      filter.saveDate = filter.searchIntervall;
      delete filter.searchIntervall;
    }
    filter.deleted = false;
    return callbackGetImplants(null, filter);
  };

  exports.getImplants = function(appUser, filter, page, callback) {
    var limit, skip;
    if (filter == null) {
      filter = {};
    }
    filter.deleted = false;
    skip = page * 100;
    limit = 100;
    if (page === -1) {
      limit = 0;
      skip = 0;
    }
    return getImplantFilter(appUser, filter, function(err, newFilter) {
      if (err != null) {
        return callback(err);
      }
      return ImplantModel.find(newFilter).skip(skip).limit(limit).populate('patient').populate('institute', {
        eprdClientNr: 0,
        eprdClientLizenz: 0,
        initialKey: 0
      }).populate('creator', {
        password: 0,
        vitabookPassword: 0,
        token: 0
      }).sort({
        art: -1
      }).exec(function(err, implantsFound) {
        if (err != null) {
          return callback(err);
        }
        if (err == null) {
          err = null;
        }
        return callback(err, implantsFound);
      });
    });
  };

  exports.buildTreatments = function(filter, endpoint, callback) {
    if (endpoint === 'vitabook') {
      filter.sendToVitabook = {
        $ne: false
      };
    }
    return ImplantModel.aggregate([
      {
        $match: filter
      }, {
        $group: {
          _id: "$operationId",
          operationName: {
            $first: "$operationName"
          },
          patient: {
            $first: "$patient"
          },
          creator: {
            $first: "$creator"
          },
          institute: {
            $first: "$institute"
          },
          implants: {
            $push: "$$ROOT"
          }
        }
      }
    ]).sort({
      _id: -1
    }).exec(function(err, resultTreatments) {
      var i, implant, index, j, len, len1, newTreatment, ref, resultTreatment, treatments, treatmentsRaw;
      if (err != null) {
        return callback(err);
      }
      treatmentsRaw = [];
      for (i = 0, len = resultTreatments.length; i < len; i++) {
        resultTreatment = resultTreatments[i];
        if (resultTreatment._id === null) {
          ref = resultTreatment.implants;
          for (index = j = 0, len1 = ref.length; j < len1; index = ++j) {
            implant = ref[index];
            newTreatment = {
              "_id": null,
              "patient": resultTreatment.patient,
              "creator": resultTreatment.creator,
              "institute": resultTreatment.institute,
              "implants": []
            };
            newTreatment.implants.push(implant);
            treatmentsRaw.push(newTreatment);
          }
        } else {
          treatmentsRaw.push(resultTreatment);
        }
      }
      treatments = [];
      return async.each(treatmentsRaw, function(treatmentRaw, next) {
        var populateQueryCreatorPatient, populateQueryInstitute;
        populateQueryInstitute = {
          path: "institute",
          select: {
            _id: 1,
            sendToVitabook: 1
          },
          options: {
            lean: true
          }
        };
        populateQueryCreatorPatient = {
          path: "creator patient",
          select: {
            password: 0,
            vitabookPassword: 0,
            token: 0,
            institute: 0,
            creator: 0,
            patient: 0
          },
          options: {
            lean: true
          }
        };
        return PatientModel.populate(treatmentRaw, [populateQueryInstitute, populateQueryCreatorPatient], function(err, treatment) {
          if (err != null) {
            return next(err);
          }
          if (endpoint === 'vitabook' && (treatment.institute != null) && (treatment.patient != null)) {
            if (treatment.patient.sendToVitabook !== false || treatment.institute.sendToVitabook !== false && treatment.patient.sendToVitabook !== true) {
              treatments.push(treatment);
            }
          } else {
            treatments.push(treatment);
          }
          return next(null);
        });
      }, function(err) {
        if (err != null) {
          return callback(err);
        }
        return callback(null, treatments);
      });
    });
  };

  exports.countImplants = function(appUser, filter, callback) {
    if (filter == null) {
      filter = {};
    }
    return getImplantFilter(appUser, filter, function(err, newFilter) {
      if (err != null) {
        return callback(err);
      }
      return ImplantModel.count(newFilter).exec(function(err, countImplants) {
        if (err != null) {
          return callback(err);
        }
        if (err == null) {
          err = null;
        }
        return callback(err, countImplants);
      });
    });
  };

  exports.getImplantDistinct = function(appUser, filter, distinct, overrideUserFilter, callback) {
    if (filter == null) {
      filter = {};
    }
    filter.deleted = false;
    if (overrideUserFilter) {
      if (appUser.is('superAdmin') || appUser.is('institute') || appUser.is('employee') || appUser.is('patient')) {

      } else {
        return callback('Keine Rechte Implantate abzufragen');
      }
      return ImplantModel.find(filter).distinct(distinct).exec(function(err, resultsFound) {
        if (err != null) {
          return callback(err);
        }
        if (err == null) {
          err = null;
        }
        resultsFound = resultsFound.splice(0, 30);
        return callback(err, resultsFound);
      });
    } else {
      return getImplantFilter(appUser, filter, function(err, newFilter) {
        if (err != null) {
          return callback(err);
        }
        return ImplantModel.find(newFilter).distinct(distinct).exec(function(err, resultsFound) {
          if (err != null) {
            return callback(err);
          }
          if (err == null) {
            err = null;
          }
          return callback(err, resultsFound);
        });
      });
    }
  };

  exports.getSerialRangeMinMax = function(appUser, filter, callback) {
    if (filter == null) {
      filter = {};
    }
    return getImplantFilter(appUser, filter, function(err, newFilter) {
      if (err != null) {
        return callback(err);
      }
      return async.parallel({
        min: function(next) {
          return ImplantModel.findOne(newFilter).sort("serialNr").exec(function(err, result) {
            if (err != null) {
              return next(err);
            }
            if (result == null) {
              return next(null, 0);
            }
            return next(null, result.serialNr);
          });
        },
        max: function(next) {
          return ImplantModel.findOne(newFilter).sort("-serialNr").exec(function(err, result) {
            if (err != null) {
              return next(err);
            }
            if (result == null) {
              return next(null, 0);
            }
            return next(null, result.serialNr);
          });
        }
      }, function(err, results) {
        if (err != null) {
          return callback(err);
        }
        return callback(null, {
          min: results.min,
          max: results.max
        });
      });
    });
  };

  exports.getLotRangeMinMax = function(appUser, filter, callback) {
    if (filter == null) {
      filter = {};
    }
    return getImplantFilter(appUser, filter, function(err, newFilter) {
      if (err != null) {
        return callback(err);
      }
      return async.parallel({
        min: function(next) {
          return ImplantModel.findOne(newFilter).sort("lot").exec(function(err, result) {
            if (err != null) {
              return next(err);
            }
            if (result == null) {
              return next(null, 0);
            }
            return next(null, result.lot);
          });
        },
        max: function(next) {
          return ImplantModel.findOne(newFilter).sort("-lot").exec(function(err, result) {
            if (err != null) {
              return next(err);
            }
            if (result == null) {
              return next(null, 0);
            }
            return next(null, result.lot);
          });
        }
      }, function(err, results) {
        if (err != null) {
          return callback(err);
        }
        return callback(null, {
          min: results.min,
          max: results.max
        });
      });
    });
  };

  exports.updateImplant = function(appUser, updateData, callback) {
    return ImplantModel.findOne({
      _id: new ObjectId(updateData._id),
      deleted: false
    }).exec(function(err, implant) {
      if (err) {
        return callback(err);
      }
      if (implant == null) {
        return callback('kein Implantat mit der ID gefunden');
      }
      if (appUser.is('superAdmin')) {

      } else if (appUser.is('institute')) {
        if (implant.institute.toString() !== appUser.institute.toString()) {
          return callback('Es können nur Implantate der eigenen Klinik editiert werden');
        }
      } else if (appUser.is('employee')) {
        if (implant.institute.toString() !== appUser.institute.toString()) {
          return callback('Es können nur Implantate der eigenen Klinik editiert werden');
        }
        if (implant.field !== appUser.field) {
          return callback('Es können nur Implantate des eigenen Fachbereichs editiert werden');
        }
      } else if (appUser.is('patient')) {
        if (implant.creator.toString() !== appUser._id.toString()) {
          return callback('Es kann nur das eigene Implantat editiert werden');
        }
      } else {
        return callback('Keine Rechte den Implantate zu editieren');
      }
      return async.parallel({
        bodyPart: function(next) {
          if (updateData.bodyPart != null) {
            return changeLogService.createLog(appUser, implant._id, 'implant', 'bodyPart', implant.bodyPart, updateData.bodyPart, next);
          } else {
            return next(null, null);
          }
        },
        art: function(next) {
          if (updateData.art != null) {
            return changeLogService.createLog(appUser, implant._id, 'implant', 'art', implant.art, updateData.art, next);
          } else {
            return next(null, null);
          }
        },
        manufacturer: function(next) {
          if (updateData.manufacturer != null) {
            return changeLogService.createLog(appUser, implant._id, 'implant', 'manufacturer', implant.manufacturer, updateData.manufacturer, next);
          } else {
            return next(null, null);
          }
        },
        referenceNr: function(next) {
          if (updateData.referenceNr != null) {
            return changeLogService.createLog(appUser, implant._id, 'implant', 'referenceNr', implant.referenceNr, updateData.referenceNr, next);
          } else {
            return next(null, null);
          }
        },
        model: function(next) {
          if (updateData.model != null) {
            return changeLogService.createLog(appUser, implant._id, 'implant', 'model', implant.model, updateData.model, next);
          } else {
            return next(null, null);
          }
        },
        type: function(next) {
          if (updateData.type != null) {
            return changeLogService.createLog(appUser, implant._id, 'implant', 'type', implant.type, updateData.type, next);
          } else {
            return next(null, null);
          }
        },
        lot: function(next) {
          if (updateData.lot != null) {
            return changeLogService.createLog(appUser, implant._id, 'implant', 'lot', implant.lot, updateData.lot, next);
          } else {
            return next(null, null);
          }
        },
        serialNr: function(next) {
          if (updateData.serialNr != null) {
            return changeLogService.createLog(appUser, implant._id, 'implant', 'serialNr', implant.serialNr, updateData.serialNr, next);
          } else {
            return next(null, null);
          }
        },
        operationId: function(next) {
          if (updateData.operationId != null) {
            return changeLogService.createLog(appUser, implant._id, 'implant', 'operationId', implant.operationId, updateData.operationId, next);
          } else {
            return next(null, null);
          }
        },
        operationName: function(next) {
          if (updateData.operationName != null) {
            return changeLogService.createLog(appUser, implant._id, 'implant', 'operationName', implant.operationName, updateData.operationName, next);
          } else {
            return next(null, null);
          }
        },
        materialNr: function(next) {
          if (updateData.materialNr != null) {
            return changeLogService.createLog(appUser, implant._id, 'implant', 'materialNr', implant.materialNr, updateData.materialNr, next);
          } else {
            return next(null, null);
          }
        },
        storage: function(next) {
          if (updateData.storage != null) {
            return changeLogService.createLog(appUser, implant._id, 'implant', 'storage', implant.storage, updateData.storage, next);
          } else {
            return next(null, null);
          }
        },
        saveDate: function(next) {
          if (updateData.saveDate != null) {
            return changeLogService.createLog(appUser, implant._id, 'implant', 'saveDate', implant.saveDate, updateData.saveDate, next);
          } else {
            return next(null, null);
          }
        },
        lastUpdated: function(next) {
          return changeLogService.createLog(appUser, implant._id, 'implant', 'lastUpdated', implant.lastUpdated, new Date().toISOString(), next);
        },
        controllDate: function(next) {
          if (updateData.controllDate != null) {
            return changeLogService.createLog(appUser, implant._id, 'implant', 'controllDate', implant.controllDate, updateData.controllDate, next);
          } else {
            return next(null, null);
          }
        },
        imOrExplant: function(next) {
          if ((updateData.imOrExplant != null) && (updateData.imOrExplant === 'Implant' || updateData.imOrExplant === 'Explant')) {
            return changeLogService.createLog(appUser, implant._id, 'implant', 'imOrExplant', implant.imOrExplant, updateData.imOrExplant, next);
          } else {
            return next(null, null);
          }
        },
        comment: function(next) {
          if (updateData.comment != null) {
            return changeLogService.createLog(appUser, implant._id, 'implant', 'comment', implant.comment, updateData.comment, next);
          } else {
            return next(null, null);
          }
        },
        sendToEprd: function(next) {
          if (updateData.sendToEprd != null) {
            return changeLogService.createLog(appUser, implant._id, 'implant', 'sendToEprd', implant.sendToEprd, updateData.sendToEprd, next);
          } else {
            return next(null, null);
          }
        },
        sendToVitabook: function(next) {
          if (updateData.sendToVitabook != null) {
            return changeLogService.createLog(appUser, implant._id, 'implant', 'sendToVitabook', implant.sendToVitabook, updateData.sendToVitabook, next);
          } else {
            return next(null, null);
          }
        },
        newPatient: function(next) {
          if (updateData.newPatient != null) {
            return PatientModel.findOne({
              _id: new ObjectId(updateData.newPatient),
              deleted: false
            }).exec(function(err, patientFound) {
              if (err) {
                return next(err);
              }
              if (patientFound == null) {
                return next('Kein Patient mit der Id im System vorhanden');
              }
              if (appUser.is('superAdmin')) {

              } else if (appUser.is('institute') || appUser.is('employee')) {
                if (patientFound.institute.toString() !== appUser.institute.toString()) {
                  return next('Es können nur Patienten der eigenen Klinik ausgewählt werden');
                }
              } else {
                return next('Kein Recht zum Ändern des Patienten');
              }
              return async.parallel({
                patient: function(next) {
                  return changeLogService.createLog(appUser, implant._id, 'implant', 'patient', implant.patient, updateData.newPatient, next);
                }
              }, function(err, results) {
                if (err != null) {
                  return next(err);
                }
                implant.patient = results.patient;
                return next(null, null);
              });
            });
          } else {
            return next(null, null);
          }
        },
        newCreator: function(next) {
          if (updateData.newCreator != null) {
            return UserModel.findOne({
              _id: new ObjectId(updateData.newCreator),
              deleted: false
            }).exec(function(err, creatorFound) {
              if (err) {
                return next(err);
              }
              if (creatorFound == null) {
                return next('Kein Erfasser mit der Id im System vorhanden');
              }
              if (appUser.is('superAdmin')) {

              } else if (appUser.is('institute')) {
                if (creatorFound.institute.toString() !== appUser.institute.toString()) {
                  return next('Es können nur Erfasser der eigenen Klinik ausgewählt werden');
                }
              } else {
                return next('Kein Recht zum Ändern des Patienten');
              }
              return async.parallel({
                creator: function(next) {
                  return changeLogService.createLog(appUser, implant._id, 'implant', 'patient', implant.patient, creatorFound._id, next);
                },
                institute: function(next) {
                  return changeLogService.createLog(appUser, implant._id, 'implant', 'institute', implant.institute, creatorFound.institute, next);
                },
                field: function(next) {
                  return changeLogService.createLog(appUser, implant._id, 'implant', 'field', implant.field, creatorFound.field, next);
                }
              }, function(err, results) {
                if (err != null) {
                  return next(err);
                }
                implant.creator = results.creator;
                implant.institute = results.institute;
                implant.field = results.field;
                return next(null, null);
              });
            });
          } else {
            return next(null, null);
          }
        }
      }, function(err, results) {
        if (err != null) {
          return callback(err);
        }
        if (results.bodyPart != null) {
          implant.bodyPart = results.bodyPart;
        }
        if (results.art != null) {
          implant.art = results.art;
        }
        if (results.manufacturer != null) {
          implant.manufacturer = results.manufacturer;
        }
        if (results.referenceNr != null) {
          implant.referenceNr = results.referenceNr;
        }
        if (results.model != null) {
          implant.model = results.model;
        }
        if (results.type != null) {
          implant.type = results.type;
        }
        if (results.lot != null) {
          implant.lot = results.lot;
        }
        if (results.serialNr != null) {
          implant.serialNr = results.serialNr;
        }
        if (results.operationId != null) {
          implant.operationId = results.operationId;
        }
        if (results.operationName != null) {
          implant.operationName = results.operationName;
        }
        if (results.storage != null) {
          implant.storage = results.storage;
        }
        if (results.materialNr != null) {
          implant.materialNr = results.materialNr;
        }
        if (results.saveDate != null) {
          implant.saveDate = new Date(results.saveDate);
        }
        if (results.controllDate != null) {
          implant.controllDate = new Date(results.controllDate);
        }
        if (results.imOrExplant != null) {
          implant.imOrExplant = results.imOrExplant;
        }
        if (results.comment != null) {
          implant.comment = results.comment;
        }
        if (results.sendToEprd != null) {
          implant.sendToEprd = results.sendToEprd;
        }
        if (results.sendToVitabook != null) {
          implant.sendToVitabook = results.sendToVitabook;
        }
        return saveImplant(appUser, implant, 'updateImplant', callback);
      });
    });
  };

  removeImplant = function(implant, callback) {
    implant.deleted = true;
    return implant.save(function(err) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, true);
    });
  };

  exports.deleteImplant = function(appUser, implantId, callback) {
    return ImplantModel.findOne({
      _id: new ObjectId(implantId),
      deleted: false
    }).exec(function(err, implant) {
      if (err) {
        return callback(err);
      }
      if (err == null) {
        err = null;
      }
      if (implant == null) {
        return callback('kein Implantat mit der ID gefunden (lokal)');
      }
      if (appUser.is('superAdmin')) {

      } else if (appUser.is('institute')) {
        if (implant.institute.toString() !== appUser.institute.toString()) {
          return callback('Es können nur Implantate der eigenen Klinik gelöscht werden');
        }
      } else if (appUser.is('employee')) {
        if (implant.institute.toString() !== appUser.institute.toString()) {
          return callback('Es können nur Implantate der eigenen Klinik gelöscht werden');
        }
        if (implant.field !== appUser.field) {
          return callback('Es können nur Implantate des eigenen Fachbereichs gelöscht werden');
        }
      } else if (appUser.is('patient')) {
        if (implant.creator.toString() !== appUser._id.toString()) {
          return callback('Es können nur eigene Implantate gelöscht werden');
        }
      } else {
        return callback('keine Berechtigung zum Löschen eines Implantate');
      }
      return removeImplant(implant, callback);
    });
  };

}).call(this);
