(function() {
  var InstituteModel, ObjectId, PatientModel, UserModel, apiSenderService, async, changeLogService, configDB, createPatient, environment, getPatientFilter, helperService, removePatient, savePatient, self, socketIoMessenger, updateLogService, userService;

  async = require('async');

  environment = require('../config/config.js')();

  configDB = require('../config/database.js')(environment);

  apiSenderService = require('../api/manager/api-sender.service.js');

  changeLogService = require('../log/change/change-log.service.js');

  updateLogService = require('../log/update/update-log.service.js');

  helperService = require('../helper/helper.service.js');

  InstituteModel = require('../institute/institute.model.js');

  UserModel = require('../user/user.model.js');

  PatientModel = require('./patient.model.js');

  socketIoMessenger = require('../socket-io/socket-io-messenger.js');

  ObjectId = require('mongoose').Types.ObjectId;

  userService = require('../user/user.service.js');

  self = this;

  exports.createUpdateLog = function(appUser, callback) {
    return updateLogService.createLog(appUser, 'local', 'national', 'patients', true, function(err, result) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, true);
    });
  };

  exports.transferPatientsToNationalRegister = function(appUser, lastUpdated, callback) {
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
    return PatientModel.find(filter).lean().exec(function(err, patientsFound) {
      if (err != null) {
        return callback(err);
      }
      if ((patientsFound != null) && patientsFound.length > 0) {
        return apiSenderService.send(environment, 'createOrUpdatePatients', patientsFound, appUserToken, function(err, patientIds) {
          if (err != null) {
            return callback(err);
          }
          return async.each(patientIds, function(patientId, next) {
            return PatientModel.update({
              _id: new Object(patientId._id)
            }, {
              $set: {
                refId: new Object(patientId.refId),
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

  savePatient = function(patient, method, callback) {
    return patient.save(function(err, result) {
      if (err != null) {
        return callback(err);
      }
      if (method === 'createPatient') {
        return callback(null, patient._id);
      } else {
        return callback(null, patient);
      }
    });
  };

  createPatient = function(appUser, patientData, callback) {
    return require('./patient.schema.js').validateEPRD(patientData, function(err) {
      var newPatient;
      if (err != null) {
        return callback(err);
      }
      err = "";
      newPatient = new PatientModel();
      if (patientData.patientId != null) {
        newPatient.patientId = patientData.patientId;
      } else {
        'Keine laufende Patientennummer angegeben';
      }
      if (patientData.sendToEprd != null) {
        newPatient.sendToEprd = patientData.sendToEprd;
      }
      if (patientData.sendToVitabook != null) {
        newPatient.sendToVitabook = patientData.sendToVitabook;
      }
      if (patientData.implantCardId != null) {
        newPatient.implantCardId = patientData.implantCardId;
      }
      if (patientData.implantCardSecurity != null) {
        newPatient.implantCardSecurity = patientData.implantCardSecurity;
      }
      if (patientData.gender != null) {
        newPatient.gender = patientData.gender;
      } else {
        err = 'Kein Geschlecht angegeben';
      }
      if (patientData.lastName != null) {
        newPatient.lastName = patientData.lastName;
      } else {
        err += 'Kein Nachname angegeben';
      }
      if (patientData.firstName != null) {
        newPatient.firstName = patientData.firstName;
      }
      if (patientData.birthdate != null) {
        if (helperService.determineType(patientData.birthdate) !== 'date') {
          newPatient.birthdate = new Date(patientData.birthdate);
          if (helperService.determineType(newPatient.birthdate) !== 'date') {
            err += "kein gülitges Geburtsdatumsformat";
          }
        } else {
          newPatient.birthdate = patientData.birthdate;
        }
      } else {
        err += 'Kein Geburtstdatum angegeben';
      }
      if (patientData.insurance != null) {
        newPatient.insurance = patientData.insurance;
      }
      if (newPatient.insurance !== null && isNaN(newPatient.insurance)) {
        err += 'Versicherung muss eine Nummer sein';
      }
      if (patientData.insurant != null) {
        newPatient.insurant = patientData.insurant;
      }
      if (newPatient.insurant !== null && isNaN(newPatient.insurant)) {
        err += 'Versichertennummer muss eine Nummer sein';
      }
      if (patientData.telephone != null) {
        newPatient.telephone = patientData.telephone;
      }
      if (patientData.mobile != null) {
        newPatient.mobile = patientData.mobile;
      }
      if (patientData.email != null) {
        newPatient.email = patientData.email;
      }
      if (patientData.street != null) {
        newPatient.street = patientData.street;
      }
      if (patientData.zipcode != null) {
        newPatient.zipcode = patientData.zipcode;
      }
      if (patientData.city != null) {
        newPatient.city = patientData.city;
      }
      if (patientData.saveDate != null) {
        if (helperService.determineType(patientData.saveDate) !== 'date') {
          newPatient.saveDate = new Date(patientData.saveDate);
          if (helperService.determineType(newPatient.saveDate) !== 'date') {
            err += 'Kein gültiges Format für das Erstellungsdatum';
          }
        } else {
          newPatient.saveDate = patientData.saveDate;
        }
      } else {
        newPatient.saveDate = new Date();
      }
      if (err !== "") {
        return callback(err);
      } else {
        err = null;
      }
      if (appUser.is('superAdmin')) {
        return async.parallel({
          first: function(next) {
            if (patientData.newInstitute != null) {
              return InstituteModel.findOne({
                _id: new ObjectId(patientData.newInstitute),
                deleted: false
              }, function(err, instituteFound) {
                if (err != null) {
                  return next(err);
                }
                if (instituteFound == null) {
                  return next('Klinik-Id unbekannt');
                }
                newPatient.institute = patientData.newInstitute;
                return next(null, instituteFound);
              });
            } else {
              return next('keine Klinik angegeben', null);
            }
          },
          second: function(next) {
            if (patientData.newCreator != null) {
              return UserModel.findOne({
                _id: new ObjectId(patientData.newCreator),
                deleted: false
              }, function(err, userFound) {
                if (err != null) {
                  return next(err);
                }
                if (userFound == null) {
                  return next('Benutzer-Id unbekannt');
                }
                newPatient.creator = patientData.newCreator;
                if (userFound.field == null) {
                  return next('Benutzer benötigt Fachrichtung');
                }
                newPatient.field = userFound.field;
                return next(null, userFound);
              });
            } else {
              return next('keinen User angegeben', null);
            }
          }
        }, function(err, results) {
          if (err != null) {
            return callback(err);
          }
          return savePatient(newPatient, 'createPatient', callback);
        });
      } else if (appUser.is('institute') || appUser.is('employee') || appUser.is('employee-auto')) {
        newPatient.creator = appUser._id;
        newPatient.institute = appUser.institute;
        newPatient.field = appUser.field;
        return savePatient(newPatient, 'createPatient', function(err, patientId) {
          var io;
          if (err != null) {
            return callback(err);
          }
          io = socketIoMessenger.getIo();
          if (patientData.previousRoute !== 'root.registerImplant') {
            if (io !== null) {
              socketIoMessenger.sendMessage(io, {
                'patient': newPatient
              });
            }
          }
          return callback(null, newPatient._id);
        });
      } else if (appUser.is('patient')) {
        newPatient.creator = appUser._id;
        newPatient.institute = appUser.institute;
        newPatient.field = appUser.field;
        return PatientModel.findOne({
          creator: appUser._id,
          deleted: false
        }, function(err, patient) {
          if (err != null) {
            return callback(err);
          }
          if (patient != null) {
            return callback('Patient bereits vorhanden');
          }
          return savePatient(newPatient, 'createPatient', function(err, patientId) {
            var io;
            if (err != null) {
              return callback(err);
            }
            io = socketIoMessenger.getIo();
            if (io !== null) {
              socketIoMessenger.sendMessage(io, {
                'patient': newPatient
              });
            }
            return callback(null, newPatient._id);
          });
        });
      } else {
        return callback('keine Berechtigung zum erfassen von Patienten');
      }
    });
  };

  exports.createPatient = createPatient;

  exports.createPatientFromUser = function(appUser, callback) {
    var patientData;
    patientData = {};
    if (appUser.lastName != null) {
      patientData.lastName = appUser.lastName;
    }
    if (appUser.firstName != null) {
      patientData.firstName = appUser.firstName;
    }
    if (appUser.gender != null) {
      patientData.gender = appUser.gender;
    }
    if (appUser.city != null) {
      patientData.city = appUser.city;
    }
    if (appUser.zipcode != null) {
      patientData.zipcode = appUser.zipcode;
    }
    if (appUser.street != null) {
      patientData.street = appUser.street;
    }
    if (appUser.email != null) {
      patientData.email = appUser.email;
    }
    if (appUser.mobile != null) {
      patientData.mobile = appUser.mobile;
    }
    if (appUser.telephone != null) {
      patientData.telephone = appUser.telephone;
    }
    patientData.birthdate = Date();
    patientData.patientId = '0000';
    return createPatient(appUser, patientData, callback);
  };

  getPatientFilter = function(appUser, filter, callbackGetPatients) {
    var err, id, patientId;
    if (appUser.is('superAdmin') || appUser.is('national')) {

    } else if (appUser.is('nationalField')) {
      filter.field = appUser.field;
    } else if (appUser.is('institute')) {
      filter.institute = appUser.institute;
    } else if (appUser.is('employee')) {
      filter.field = appUser.field;
      filter.institute = appUser.institute;
    } else if (appUser.is('employee-auto')) {
      if ((filter._id == null) && (filter.patientId == null)) {
        return callbackGetPatients("Ein Patient kann nur mit Id (Manager oder der Klinik) abgerufen werden");
      }
      id = filter._id;
      patientId = filter.patientId;
      filter = {};
      filter.field = appUser.field;
      filter.institute = appUser.institute;
      filter.creator = appUser._id;
      if (id != null) {
        filter._id = id;
      }
      if (patientId != null) {
        filter.patientId = patientId;
      }
    } else if (appUser.is('patient')) {
      filter.creator = appUser._id;
    } else {
      return callbackGetPatients('Keine Berechtigung zum Lesen der Patienten');
    }
    if ((filter.lastName != null) && typeof filter.lastName === 'string') {
      try {
        filter.lastName = new RegExp(filter.lastName, "i");
      } catch (_error) {
        err = _error;
        filter.lastName = new RegExp('.*', "i");
      }
    }
    filter.deleted = false;
    return callbackGetPatients(null, filter);
  };

  exports.getPatients = function(appUser, filter, selector, populate, limit, callback) {
    if (filter == null) {
      filter = {};
    }
    filter.deleted = false;
    if (limit == null) {
      limit = 0;
    }
    if (appUser.is('superAdmin') || appUser.is('institute') || appUser.is('employee') || appUser.is('employee-auto') || appUser.is('patient')) {

    } else {
      return callback('Keine Rechte Patienten abzufragen');
    }
    return getPatientFilter(appUser, filter, function(err, newFilter) {
      var Query;
      if (err != null) {
        return callback(err);
      }
      Query = PatientModel.find(newFilter).select(selector).limit(limit);
      if (populate.institute != null) {
        Query.populate('institute', populate.institute);
      }
      if (populate.creator != null) {
        Query.populate('creator', populate.creator);
      }
      return Query.sort({
        saveDate: -1
      }).exec(function(err, patientsFound) {
        if (err != null) {
          return callback(err);
        }
        if (err == null) {
          err = null;
        }
        return callback(err, patientsFound);
      });
    });
  };

  exports.updatePatient = function(appUser, updateData, callback) {
    return PatientModel.findOne({
      _id: new ObjectId(updateData._id),
      deleted: false
    }).exec(function(err, patient) {
      if (err) {
        return callback(err);
      }
      if (patient == null) {
        return callback('kein Patient mit der ID gefunden');
      }
      if (appUser.is('superAdmin')) {

      } else if (appUser.is('institute')) {
        if (patient.institute.toString() !== appUser.institute.toString()) {
          return callback('Es können nur Patienten der eigenen Klinik editiert werden');
        }
      } else if (appUser.is('employee')) {
        if (patient.institute.toString() !== appUser.institute.toString()) {
          return callback('Es können nur Patienten der eigenen Klinik editiert werden');
        }
        if (patient.field !== appUser.field) {
          return callback('Es können nur Patienten des eigenen Fachbereichs editiert werden');
        }
      } else if (appUser.is('employee-auto')) {
        if (patient.institute.toString() !== appUser.institute.toString()) {
          return callback('Es können nur Patienten der eigenen Klinik editiert werden');
        }
        if (patient.field !== appUser.field) {
          return callback('Es können nur Patienten des eigenen Fachbereichs editiert werden');
        }
        if (patient.creator.toString() !== appUser._id.toString()) {
          console.log(patient.creator.toString() !== appUser._id.toString(), patient.creator.toString(), appUser._id.toString());
          return callback('Es können nur selbst erstellte Patienten editiert werden');
        }
      } else if (appUser.is('patient')) {
        if (patient._id.toString() !== appUser._id.toString()) {
          return callback('Es kann nur das eigene Profil editiert werden');
        }
      } else {
        return callback('Keine Rechte den Patienten zu editieren');
      }
      return async.parallel({
        sendToEprd: function(next) {
          if (updateData.sendToEprd != null) {
            return changeLogService.createLog(appUser, patient._id, 'patient', 'sendToEprd', patient.sendToEprd, updateData.sendToEprd, next);
          } else {
            return next(null, null);
          }
        },
        sendToVitabook: function(next) {
          if (updateData.sendToVitabook != null) {
            return changeLogService.createLog(appUser, patient._id, 'patient', 'sendToVitabook', patient.sendToVitabook, updateData.sendToVitabook, next);
          } else {
            return next(null, null);
          }
        },
        institute: function(next) {
          if ((updateData.newInstitute != null) && appUser.is('superAdmin')) {
            return changeLogService.createLog(appUser, patient._id, 'patient', 'institute', patient.institute, new ObjectId(updateData.newInstitute), next);
          } else {
            return next(null, null);
          }
        },
        field: function(next) {
          if ((updateData.newField != null) && (appUser.is('superAdmin') || appUser.is('institute'))) {
            return changeLogService.createLog(appUser, patient._id, 'patient', 'field', patient.field, updateData.newField, next);
          } else {
            return next(null, null);
          }
        },
        saveDate: function(next) {
          if (updateData.saveDate != null) {
            return changeLogService.createLog(appUser, patient._id, 'patient', 'saveDate', patient.saveDate, updateData.saveDate, next);
          } else {
            return next(null, null);
          }
        },
        patientId: function(next) {
          if (updateData.patientId != null) {
            return changeLogService.createLog(appUser, patient._id, 'patient', 'patientId', patient.patientId, updateData.patientId, next);
          } else {
            return next(null, null);
          }
        },
        implantCardId: function(next) {
          if (updateData.implantCardId != null) {
            return changeLogService.createLog(appUser, patient._id, 'patient', 'implantCardId', patient.implantCardId, updateData.implantCardId, next);
          } else {
            return next(null, null);
          }
        },
        implantCardSecurity: function(next) {
          if (updateData.implantCardSecurity != null) {
            return changeLogService.createLog(appUser, patient._id, 'patient', 'implantCardSecurity', patient.implantCardSecurity, updateData.implantCardSecurity, next);
          } else {
            return next(null, null);
          }
        },
        gender: function(next) {
          if (updateData.gender != null) {
            return changeLogService.createLog(appUser, patient._id, 'patient', 'gender', patient.gender, updateData.gender, next);
          } else {
            return next(null, null);
          }
        },
        lastName: function(next) {
          if (updateData.lastName != null) {
            return changeLogService.createLog(appUser, patient._id, 'patient', 'lastName', patient.lastName, updateData.lastName, next);
          } else {
            return next(null, null);
          }
        },
        firstName: function(next) {
          if (updateData.firstName != null) {
            return changeLogService.createLog(appUser, patient._id, 'patient', 'firstName', patient.firstName, updateData.firstName, next);
          } else {
            return next(null, null);
          }
        },
        birthdate: function(next) {
          if (updateData.birthdate != null) {
            return changeLogService.createLog(appUser, patient._id, 'patient', 'birthdate', patient.birthdate, updateData.birthdate, next);
          } else {
            return next(null, null);
          }
        },
        insurance: function(next) {
          if (updateData.insurance != null) {
            if (isNaN(updateData.insurance)) {
              return next('Versicherung muss eine Nummer sein');
            }
            return changeLogService.createLog(appUser, patient._id, 'patient', 'insurance', patient.insurance, updateData.insurance, next);
          } else {
            return next(null, null);
          }
        },
        insurant: function(next) {
          if (updateData.insurant != null) {
            if (isNaN(updateData.insurant)) {
              return next('Versichertennummer muss eine Nummer sein');
            }
            return changeLogService.createLog(appUser, patient._id, 'patient', 'insurant', patient.insurant, updateData.insurant, next);
          } else {
            return next(null, null);
          }
        },
        telephone: function(next) {
          if (updateData.telephone != null) {
            return changeLogService.createLog(appUser, patient._id, 'patient', 'telephone', patient.telephone, updateData.telephone, next);
          } else {
            return next(null, null);
          }
        },
        mobile: function(next) {
          if (updateData.mobile != null) {
            return changeLogService.createLog(appUser, patient._id, 'patient', 'mobile', patient.mobile, updateData.mobile, next);
          } else {
            return next(null, null);
          }
        },
        email: function(next) {
          if (updateData.email != null) {
            return changeLogService.createLog(appUser, patient._id, 'patient', 'email', patient.email, updateData.email, next);
          } else {
            return next(null, null);
          }
        },
        street: function(next) {
          if (updateData.street != null) {
            return changeLogService.createLog(appUser, patient._id, 'patient', 'street', patient.street, updateData.street, next);
          } else {
            return next(null, null);
          }
        },
        zipcode: function(next) {
          if (updateData.zipcode != null) {
            return changeLogService.createLog(appUser, patient._id, 'patient', 'zipcode', patient.zipcode, updateData.zipcode, next);
          } else {
            return next(null, null);
          }
        },
        city: function(next) {
          if (updateData.city != null) {
            return changeLogService.createLog(appUser, patient._id, 'patient', 'city', patient.city, updateData.city, next);
          } else {
            return next(null, null);
          }
        },
        lastUpdated: function(next) {
          return changeLogService.createLog(appUser, patient._id, 'patient', 'lastUpdated', patient.lastUpdated, new Date().toISOString(), next);
        }
      }, function(err, results) {
        if (err != null) {
          return callback(err);
        }
        if (results.sendToEprd != null) {
          patient.sendToEprd = results.sendToEprd;
        }
        if (results.sendToVitabook != null) {
          patient.sendToVitabook = results.sendToVitabook;
        }
        if (results.institute != null) {
          patient.institute = results.institute;
        }
        if (results.field != null) {
          patient.field = results.field;
        }
        if (results.saveDate != null) {
          patient.saveDate = results.saveDate;
        }
        if (results.patientId != null) {
          patient.patientId = results.patientId;
        }
        if (results.implantCardId != null) {
          patient.implantCardId = results.implantCardId;
        }
        if (results.implantCardSecurity != null) {
          patient.implantCardSecurity = results.implantCardSecurity;
        }
        if (results.gender != null) {
          patient.gender = results.gender;
        }
        if (results.lastName != null) {
          patient.lastName = results.lastName;
        }
        if (results.firstName != null) {
          patient.firstName = results.firstName;
        }
        if (results.birthdate != null) {
          patient.birthdate = results.birthdate;
        }
        if (results.insurance != null) {
          patient.insurance = results.insurance;
        }
        if (results.insurant != null) {
          patient.insurant = results.insurant;
        }
        if (results.telephone != null) {
          patient.telephone = results.telephone;
        }
        if (results.mobile != null) {
          patient.mobile = results.mobile;
        }
        if (results.email != null) {
          patient.email = results.email;
        }
        if (results.street != null) {
          patient.street = results.street;
        }
        if (results.zipcode != null) {
          patient.zipcode = results.zipcode;
        }
        if (results.city != null) {
          patient.city = results.city;
        }
        return savePatient(patient, 'updatePatient', callback);
      });
    });
  };

  removePatient = function(patient, callback) {
    patient.deleted = true;
    return patient.save(function(err) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, true);
    });
  };

  exports.deletePatient = function(appUser, patientId, callback) {
    return PatientModel.findOne({
      _id: new ObjectId(patientId),
      deleted: false
    }).exec(function(err, patient) {
      if (err) {
        return callback(err);
      }
      if (err == null) {
        err = null;
      }
      if (patient == null) {
        return callback('kein Patient mit der ID gefunden' + patientId);
      }
      if (appUser.is('superAdmin')) {

      } else if (appUser.is('institute')) {
        if (patient.institute.toString() !== appUser.institute.toString()) {
          return callback('Es können nur Patienten der eigenen Klinik gelöscht werden');
        }
      } else if (appUser.is('employee')) {
        if (patient.institute.toString() !== appUser.institute.toString()) {
          return callback('Es können nur Patienten der eigenen Klinik gelöscht werden');
        }
        if (patient.field !== appUser.field) {
          return callback('Es können nur Patienten des eigenen Fachbereichs gelöscht werden');
        }
      } else if (appUser.is('patient')) {
        if (patient.creator.toString() !== appUser._id.toString()) {
          return callback('Es kann nur das eigene Profil gelöscht werden' + patient.creator.toString() + ' : ' + appUser._id.toString());
        }
      } else {
        return callback('keine Berechtigung zum Löschen eines Patienten');
      }
      return removePatient(patient, callback);
    });
  };

}).call(this);
