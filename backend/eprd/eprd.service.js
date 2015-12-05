(function() {
  var EprdModel, ImplantModel, ObjectId, PatientModel, apiSenderService, async, changeLogService, configDB, environment, eprdApiService, eprdSchema, registerConfig, registerType, removeEprd, saveEprd, self, updateLogService;

  async = require('async');

  environment = require('../config/config.js')();

  registerConfig = require('../config/register-config.js');

  registerType = registerConfig.getType();

  configDB = require('../config/database.js')(environment);

  apiSenderService = require('../api/manager/api-sender.service.js');

  eprdApiService = require('../api/eprd-api/eprd-api.service.js');

  updateLogService = require('../log/update/update-log.service.js');

  changeLogService = require('../log/change/change-log.service.js');

  PatientModel = require('../patient/patient.model.js');

  ImplantModel = require('../implant/implant.model.js');

  EprdModel = require('./eprd.model.js');

  eprdSchema = require('./eprd.schema.js');

  ObjectId = require('mongoose').Types.ObjectId;

  self = this;

  exports.createUpdateLog = function(appUser, register, callback) {
    var from, operation, to;
    switch (register) {
      case 'eprd':
        from = 'national';
        to = 'eprd';
        operation = 'eprds';
        break;
      case 'manager':
        from = 'local';
        to = 'national';
        operation = 'eprds';
        break;
      default:
        return callback("No valid register (createUpdateLog) " + register);
    }
    return updateLogService.createLog(appUser, from, to, operation, true, function(err, result) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, true);
    });
  };

  exports.transferEprdsToRegister = function(appUser, startDate, register, callback) {
    var appUserToken, filter;
    appUserToken = appUser.token;
    filter = {};
    switch (register) {
      case 'eprd':
        if (startDate !== 'none') {
          filter = {
            "$or": [
              {
                "lastSyncedEprd": {
                  "$gt": startDate
                },
                "lastSyncedEprd": null
              }
            ]
          };
        }
        break;
      case 'manager':
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
        break;
      default:
        return callback("No valid register (transferEprdsToRegister a) " + register);
    }
    return EprdModel.find(filter).populate(institute, '_id sendToEprd').lean().exec(function(err, eprdsFound) {
      var eprdFound, i, idList, institute, len;
      if (err != null) {
        return callback(err);
      }
      if ((eprdsFound != null) && eprdsFound.length > 0) {
        switch (register) {
          case 'eprd':
            institute = eprdsFound[0].institute;
            idList = [];
            filter['institute'] = institute._id;
            for (i = 0, len = eprdsFound.length; i < len; i++) {
              eprdFound = eprdsFound[i];
              idList.push(eprdFound.implant);
            }
            filter['refId'] = {};
            filter['refId']['$in'] = idList;
            filter['operationFinished'] = true;
            filter['sendToEprd'] = {
              $ne: false
            };
            return ImplantModel.find(filter).lean().exec(function(err, implantsFound) {
              var transfered;
              if (err != null) {
                return callback(err);
              }
              if ((implantsFound != null) && implantsFound.length > 0) {
                transfered = false;
                return async.eachSeries(implantsFound, function(implant, next) {
                  return PatientModel.findOne({
                    refId: new ObjectId(implant.patient),
                    institute: institute._id
                  }, function(err, patientFound) {
                    if (err != null) {
                      return callback(err);
                    }
                    if (patientFound === null) {
                      return callback("Patient nicht gefunden");
                    }
                    if (patientFound.sendToEprd === false || institute.sendToEprd === false && patientFound.sendToEprd !== true) {
                      return callback(null);
                    }
                    return eprdApiService.eprdWSsaveImplant(patientFound, implant, function(err, result) {
                      if (err != null) {
                        return next(err);
                      }
                      if (result === true) {
                        transfered = true;
                      }
                      return next(null);
                    });
                  });
                }, function(err) {
                  if (err != null) {
                    return callback(err);
                  }
                  return self.createUpdateLog(appUser, register, function(err) {
                    if (err != null) {
                      return callback(err);
                    }
                    if (transfered === true) {
                      return callback(null, true);
                    }
                    return callback(null, 'nothing to transfer');
                  });
                });
              } else {
                return self.createUpdateLog(appUser, register, function(err) {
                  if (err != null) {
                    return callback(err);
                  }
                  return callback(null, 'nothing to transfer');
                });
              }
            });
          case 'manager':
            return apiSenderService.send(environment, 'createOrUpdateEprds', eprdsFound, appUserToken, function(err, eprdIds) {
              if (err != null) {
                return callback(err);
              }
              return async.each(eprdIds, function(eprdId, next) {
                return EprdModel.update({
                  _id: new Object(eprdId._id)
                }, {
                  $set: {
                    refId: new Object(eprdId.refId),
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
                return self.createUpdateLog(appUser, register, callback);
              });
            });
          default:
            return callback("No valid register (transferEprdsToRegister b) " + register);
        }
      } else {
        return self.createUpdateLog(appUser, register, function(err, result) {
          if (err != null) {
            return callback(err);
          }
          return callback(null, 'nothing to transfer');
        });
      }
    });
  };

  saveEprd = function(eprd, method, callback) {
    return eprd.save(function(err, result) {
      if (err != null) {
        return callback(err);
      }
      if (method === 'createEprd') {
        return callback(null, eprd._id);
      } else {
        return callback(null, eprd);
      }
    });
  };

  exports.createEprd = function(appUser, implantId, instituteId, eprdData, callback) {
    if (eprdData.gelenk === '1') {
      if (eprdData.vorOpHuefte != null) {
        eprdData.vorop = eprdData.vorOpHuefte;
      }
      if (eprdData.wechselgrundHuefte != null) {
        eprdData.wechselgrund = eprdData.wechselgrundHuefte;
      }
    } else if (eprdData.gelenk === '2') {
      if (eprdData.vorOpKnie != null) {
        eprdData.vorop = eprdData.vorOpKnie;
      }
      if (eprdData.wechselgrundKnie != null) {
        eprdData.wechselgrund = eprdData.wechselgrundKnie;
      }
    }
    return eprdSchema.validateEPRD(eprdData, function(err) {
      var newEprd;
      if ((err != null ? err.message : void 0) != null) {
        return callback(err.message);
      }
      err = "";
      newEprd = new EprdModel();
      if (implantId != null) {
        newEprd.implant = implantId;
      } else {
        err += "Kein Implantat angegeben.";
      }
      if (instituteId != null) {
        newEprd.institute = instituteId;
      } else {
        err += "Keine Klinik angegeben.";
      }
      if (eprdData.artikeltyp != null) {
        newEprd.artikeltyp = eprdData.artikeltyp;
      } else {
        err += "Keine Artikeltyp angegeben.";
      }
      if (eprdData.gelenk != null) {
        newEprd.gelenk = eprdData.gelenk;
      } else {
        err += "Kein Gelenklokalisation angegeben.";
      }
      if (eprdData.seite != null) {
        newEprd.seite = eprdData.seite;
      } else {
        err += "Kein Seitenlokalisation angegeben.";
      }
      if (eprdData.arteingriff != null) {
        newEprd.arteingriff = eprdData.arteingriff;
      } else {
        err += "Keine Eingriffsart angegeben.";
      }
      if (eprdData.hersteller != null) {
        newEprd.hersteller = eprdData.hersteller;
      } else {
        err += "Keine Hersteller angegeben.";
      }
      if (eprdData.vorop != null) {
        newEprd.vorop = eprdData.vorop;
      }
      if (eprdData.wechselgrund != null) {
        newEprd.wechselgrund = eprdData.wechselgrund;
      }
      if (eprdData.zweizeitwechsel != null) {
        newEprd.zweizeitwechsel = eprdData.zweizeitwechsel;
      }
      if (eprdData.freitext != null) {
        newEprd.freitext = eprdData.freitext;
      }
      if (eprdData.menge != null) {
        newEprd.menge = eprdData.menge;
      }
      if (eprdData.einheit != null) {
        newEprd.einheit = eprdData.einheit;
      }
      if (err !== "") {
        return callback(err);
      } else {
        err = null;
      }
      if (appUser.is('superAdmin')) {

      } else if (appUser.is('institute') || appUser.is('employee')) {

      } else if (appUser.is('patient')) {

      } else {
        return callback('keine Berechtigung zum Erfassen des EPRD Datensatzes');
      }
      return saveEprd(newEprd, 'createEprd', callback);
    });
  };

  exports.getEprds = function(appUser, filter, callback) {
    if (filter == null) {
      filter = {};
    }
    filter.deleted = false;
    return EprdModel.find(filter).exec(function(err, eprdsFound) {
      if (err != null) {
        return callback(err);
      }
      if (err == null) {
        err = null;
      }
      return callback(err, eprdsFound);
    });
  };

  exports.updateEprd = function(appUser, updateData, callback) {
    return EprdModel.findOne({
      _id: new ObjectId(updateData._id),
      deleted: false
    }).exec(function(err, eprd) {
      if (err) {
        return callback(err);
      }
      if (eprd == null) {
        return callback('kein EPRD Datensatz mit der ID gefunden');
      }
      if (appUser.is('superAdmin')) {

      } else if (appUser.is('institute') || appUser.is('employee')) {

      } else if (appUser.is('patient')) {

      } else {
        return callback('Keine Rechte den EPRD Datensatz zu editieren');
      }
      return async.parallel({
        artikeltyp: function(next) {
          if (updateData.artikeltyp != null) {
            return changeLogService.createLog(appUser, eprd._id, 'eprd', 'artikeltyp', eprd.artikeltyp, updateData.artikeltyp, next);
          } else {
            return next(null, null);
          }
        },
        gelenk: function(next) {
          if (updateData.gelenk != null) {
            return changeLogService.createLog(appUser, eprd._id, 'eprd', 'gelenk', eprd.gelenk, updateData.gelenk, next);
          } else {
            return next(null, null);
          }
        },
        seite: function(next) {
          if (updateData.seite != null) {
            return changeLogService.createLog(appUser, eprd._id, 'eprd', 'seite', eprd.seite, updateData.seite, next);
          } else {
            return next(null, null);
          }
        },
        arteingriff: function(next) {
          if (updateData.arteingriff != null) {
            return changeLogService.createLog(appUser, eprd._id, 'eprd', 'arteingriff', eprd.arteingriff, updateData.arteingriff, next);
          } else {
            return next(null, null);
          }
        },
        hersteller: function(next) {
          if (updateData.hersteller != null) {
            return changeLogService.createLog(appUser, eprd._id, 'eprd', 'hersteller', eprd.hersteller, updateData.hersteller, next);
          } else {
            return next(null, null);
          }
        },
        vorop: function(next) {
          if (updateData.vorOpHuefte != null) {
            return changeLogService.createLog(appUser, eprd._id, 'eprd', 'vorop', eprd.vorop, updateData.vorOpHuefte, next);
          } else if (updateData.vorOpKnie != null) {
            return changeLogService.createLog(appUser, eprd._id, 'eprd', 'vorop', eprd.vorop, updateData.vorOpKnie, next);
          } else {
            return next(null, null);
          }
        },
        wechselgrund: function(next) {
          if (updateData.wechselgrund != null) {
            return changeLogService.createLog(appUser, eprd._id, 'eprd', 'wechselgrund', eprd.wechselgrund, updateData.wechselgrund, next);
          } else {
            return next(null, null);
          }
        },
        freitext: function(next) {
          if (updateData.freitext != null) {
            return changeLogService.createLog(appUser, eprd._id, 'eprd', 'freitext', eprd.freitext, updateData.freitext, next);
          } else {
            return next(null, null);
          }
        },
        menge: function(next) {
          if (updateData.menge != null) {
            return changeLogService.createLog(appUser, eprd._id, 'eprd', 'menge', eprd.menge, updateData.menge, next);
          } else {
            return next(null, null);
          }
        },
        einheit: function(next) {
          if (updateData.einheit != null) {
            return changeLogService.createLog(appUser, eprd._id, 'eprd', 'einheit', eprd.einheit, updateData.einheit, next);
          } else {
            return next(null, null);
          }
        },
        zweizeitwechsel: function(next) {
          if (updateData.zweizeitwechsel != null) {
            return changeLogService.createLog(appUser, eprd._id, 'eprd', 'zweizeitwechsel', eprd.zweizeitwechsel, updateData.zweizeitwechsel, next);
          } else {
            return next(null, null);
          }
        },
        lastUpdated: function(next) {
          return changeLogService.createLog(appUser, eprd._id, 'eprd', 'lastUpdated', eprd.lastUpdated, new Date().toISOString(), next);
        },
        newImplant: function(next) {
          if (updateData.newImplant != null) {
            return ImplantModel.findOne({
              _id: new ObjectId(updateData.newImplant),
              deleted: false
            }).exec(function(err, implantFound) {
              if (err) {
                return next(err);
              }
              if (implantFound == null) {
                return next('Kein Implantat mit der Id im System vorhanden');
              }
              if (appUser.is('superAdmin')) {

              } else if (appUser.is('institute') || appUser.is('employee')) {

              } else {
                return next('Kein Recht zum Ändern des EPRD Datensatzes');
              }
              return async.parallel({
                implant: function(next) {
                  return changeLogService.createLog(appUser, eprd._id, 'eprd', 'implant', eprd.implant, updateData.newImplant, next);
                }
              }, function(err, results) {
                if (err != null) {
                  return next(err);
                }
                eprd.implant = results.implant;
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
        if (results.artikeltyp != null) {
          eprd.artikeltyp = results.artikeltyp;
        }
        if (results.gelenk != null) {
          eprd.gelenk = results.gelenk;
        }
        if (results.seite != null) {
          eprd.seite = results.seite;
        }
        if (results.arteingriff != null) {
          eprd.arteingriff = results.arteingriff;
        }
        if (results.hersteller != null) {
          eprd.hersteller = results.hersteller;
        }
        if (results.vorop != null) {
          eprd.vorop = results.vorop;
        }
        if (results.wechselgrund != null) {
          eprd.wechselgrund = results.wechselgrund;
        }
        if (results.freitext != null) {
          eprd.freitext = results.freitext;
        }
        if (results.menge != null) {
          eprd.menge = results.menge;
        }
        if (results.einheit != null) {
          eprd.einheit = results.einheit;
        }
        if (results.zweizeitwechsel != null) {
          eprd.zweizeitwechsel = results.zweizeitwechsel;
        }
        if (results.lastUpdated != null) {
          eprd.lastUpdated = new Date(results.lastUpdated);
        }
        return saveEprd(eprd, 'updateEprd', false, callback);
      });
    });
  };

  removeEprd = function(eprd, callback) {
    eprd.deleted = true;
    return eprd.save(function(err) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, true);
    });
  };

  exports.deleteEprd = function(appUser, eprdId, callback) {
    return EprdModel.findOne({
      _id: new ObjectId(eprdId),
      deleted: false
    }).exec(function(err, eprd) {
      if (err) {
        return callback(err);
      }
      if (err == null) {
        err = null;
      }
      if (eprd == null) {
        return callback('kein EPRD Datensatz mit der ID gefunden');
      }
      if (appUser.is('superAdmin')) {

      } else if (appUser.is('institute') || appUser.is('employee')) {

      } else if (appUser.is('patient')) {

      } else {
        return callback('keine Berechtigung zum Löschen eines EPRD Datensatzes');
      }
      return removeEprd(eprd, callback);
    });
  };

}).call(this);
