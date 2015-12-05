(function() {
  var ImplantModel, InstituteModel, InstituteSchema, ObjectId, PatientModel, UserModel, apiSenderService, async, configDB, environment, getInstituteFilter, mongoose, removeInstitute, saveInstitute, self, updateLogService;

  async = require('async');

  environment = require('../config/config.js')();

  configDB = require('../config/database.js')(environment);

  apiSenderService = require('../api/manager/api-sender.service.js');

  updateLogService = require('../log/update/update-log.service.js');

  mongoose = require('mongoose');

  InstituteModel = require('./institute.model.js');

  InstituteSchema = require('./institute.schema.js');

  UserModel = require('../user/user.model.js');

  PatientModel = require('../patient/patient.model.js');

  ImplantModel = require('../implant/implant.model.js');

  ObjectId = mongoose.Types.ObjectId;

  self = this;

  exports.createUpdateLog = function(appUser, from, to, success, callback) {
    return updateLogService.createLog(appUser, from, to, 'institutes', true, function(err, result) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, true);
    });
  };

  exports.transferInstitutesToNationalRegister = function(appUser, lastUpdated, callback) {
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
    return InstituteModel.find(filter).lean().exec(function(err, institutesFound) {
      if (err != null) {
        return callback(err);
      }
      if ((institutesFound != null) && institutesFound.length > 0) {
        return apiSenderService.send(environment, 'createOrUpdateInstitutes', institutesFound, appUserToken, function(err, instituteIds) {
          if (err != null) {
            return callback(err);
          }
          return async.each(instituteIds, function(instituteId, next) {
            return InstituteModel.update({
              _id: new Object(instituteId._id)
            }, {
              $set: {
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
            return updateLogService.createLog(appUser, 'local', 'national', 'institutes', true, function(err, result) {
              if (err != null) {
                return callback(err);
              }
              return callback(null, true);
            });
          });
        });
      } else {
        return updateLogService.createLog(appUser, 'local', 'national', 'institutes', true, function(err, result) {
          if (err != null) {
            return callback(err);
          }
          return callback(null, 'nothing to transfer');
        });
      }
    });
  };

  saveInstitute = function(institute, method, callback) {
    return institute.save(function(err, result) {
      if (err != null) {
        return callback(err);
      }
      if (method === 'createInstitute') {
        return callback(null, institute._id);
      } else {
        return callback(null, institute);
      }
    });
  };

  exports.createInstitute = function(appUser, instituteData, callback) {
    return InstituteSchema.validateEPRD(instituteData, function(err) {
      var newInstitute;
      if ((err != null ? err.message : void 0) != null) {
        return callback(err.message);
      }
      err = "";
      if (appUser.is('superAdmin')) {

      } else {
        return callback('Keine Berechtigung zum erfassen von Kliniken');
      }
      newInstitute = new InstituteModel();
      if (instituteData.name != null) {
        newInstitute.name = instituteData.name;
      } else {
        err += "Kein Institutname angegeben.";
      }
      if (instituteData.baseUrl != null) {
        newInstitute.baseUrl = instituteData.baseUrl;
      } else {
        err += "Keine Url zum lokalen Register angegeben.";
      }
      if (instituteData.vitabookId != null) {
        newInstitute.vitabookId = instituteData.vitabookId;
      }
      if (instituteData.instituteNr != null) {
        newInstitute.instituteNr = instituteData.instituteNr;
      }
      if (instituteData.telephone != null) {
        newInstitute.telephone = instituteData.telephone;
      }
      if (instituteData.email != null) {
        newInstitute.email = instituteData.email;
      }
      if (instituteData.street != null) {
        newInstitute.street = instituteData.street;
      }
      if (instituteData.zipcode != null) {
        newInstitute.zipcode = instituteData.zipcode;
      }
      if (instituteData.city != null) {
        newInstitute.city = instituteData.city;
      }
      if (instituteData.eprdClientNr != null) {
        newInstitute.eprdClientNr = instituteData.eprdClientNr;
      }
      if (instituteData.eprdClientLizenz != null) {
        newInstitute.eprdClientLizenz = instituteData.eprdClientLizenz;
      }
      if (instituteData.locationNr != null) {
        newInstitute.locationNr = instituteData.locationNr;
      }
      if (instituteData.unitNr != null) {
        newInstitute.unitNr = instituteData.unitNr;
      }
      if (instituteData.initialKey != null) {
        newInstitute.initialKey = instituteData.initialKey;
      }
      if (instituteData.sendToEprd != null) {
        newInstitute.sendToEprd = instituteData.sendToEprd;
      }
      if (instituteData.sendToVitabook != null) {
        newInstitute.sendToVitabook = instituteData.sendToVitabook;
      }
      if (err !== "") {
        return callback(err);
      } else {
        err = null;
      }
      return saveInstitute(newInstitute, 'createInstitute', callback);
    });
  };

  exports.getInitialFromNationalRegister = function(appUser, initialKey, callback) {
    var appUserToken, data, filter;
    if (appUser.is('superAdmin')) {

    } else {
      return callback('Keine Berechtigung zum Abfragen der ersten Klinik');
    }
    filter = {};
    if (typeof err !== "undefined" && err !== null) {
      return callback(err);
    }
    appUserToken = appUser.token;
    data = {};
    data.initialKey = initialKey;
    return apiSenderService.send(environment, "getInitial", data, appUserToken, function(err, initial) {
      if (err != null) {
        return callback(err);
      }
      if (initial == null) {
        return callback("keine Daten erhalten");
      }
      console.log("initial", JSON.stringify(initial));
      return async.parallel({
        institutes: function(next) {
          var institute;
          if (initial.institute == null) {
            return next("Keine Klinik vorhanden");
          }
          institute = initial.institute;
          delete institute.__v;
          institute.lastSyncedManager = new Date();
          console.log("SAVING initial institute: ", institute);
          return InstituteModel.update({
            _id: institute._id
          }, institute, {
            upsert: true,
            "new": true
          }, function(err, savedObject) {
            console.log("err", err, "savedObject", savedObject);
            if (err != null) {
              return next(err);
            }
            return next(null, savedObject._id);
          });
        },
        users: function(next) {
          var users;
          if ((initial.users == null) || initial.users.length === 0) {
            return next("Keine Benutzer vorhanden");
          }
          users = initial.users;
          return async.each(users, function(user, next) {
            user.refId = user._id;
            delete user._id;
            delete user.__v;
            console.log("SAVING initial user: ", user);
            return UserModel.update({
              _id: user.refId
            }, user, {
              upsert: true,
              "new": true
            }, function(err, savedObject) {
              if (err != null) {
                return next(err);
              }
              return next(null, savedObject._id);
            });
          }, function(err) {
            if (err != null) {
              return callback(err);
            }
            return self.createUpdateLog(appUser, 'national', 'local', true, function(err, result) {
              if (err != null) {
                return callback(err);
              }
              return callback(null, true);
            });
          });
        }
      }, function(err, results) {
        if (err != null) {
          return callback(err);
        }
        console.log("SAVED initial institute: ", institute);
        return callback(null, true);
      });
    });
  };

  getInstituteFilter = function(appUser, filter, callbackGetInstitutes) {
    if (appUser.is('superAdmin')) {

    } else if (appUser.is('institute') || appUser.is('employee') || appUser.is('employee-auto')) {
      filter._id = appUser.institute;
    } else {
      return callbackGetInstitutes('Keine Berechtigung zum Lesen der Kliniken');
    }
    filter.deleted = false;
    return callbackGetInstitutes(null, filter);
  };

  exports.getInstitutes = function(appUser, filter, callback) {
    if (filter == null) {
      filter = {};
    }
    return getInstituteFilter(appUser, filter, function(err, filter) {
      var selector, selectorResponsiblePerson;
      if (err != null) {
        return callback(err);
      }
      selector = {
        initialKey: 0
      };
      selectorResponsiblePerson = {
        password: 0,
        vitabookPassword: 0,
        token: 0
      };
      if (appUser.is('superAdmin')) {
        delete selectorResponsiblePerson.token;
        delete selector.initialKey;
      }
      return InstituteModel.find(filter).select(selector).populate('responsiblePerson', selectorResponsiblePerson).sort({
        name: -1
      }).exec(function(err, institutesFound) {
        if (err != null) {
          return callback(err);
        }
        if ((institutesFound == null) || institutesFound.length === 0) {
          return callback('keine Klinik gefunden');
        }
        if (appUser.is('superAdmin')) {

        } else if (appUser.is('institute') || appUser.is('employee') || appUser.is('employee-auto') || appUser.is('patient')) {
          if (((institutesFound != null ? institutesFound[0] : void 0) != null) && institutesFound[0]._id.toString() !== appUser.institute.toString()) {
            return callback('Es kann nur die eigene Klinik abgerufen werden' + JSON.stringify(institutesFound));
          }
        } else {
          return callback('Keine Berechtigung zur Anzeige der Kliniken');
        }
        return callback(null, institutesFound);
      });
    });
  };

  exports.setResponsiblePerson = function(userId, instituteId, callback) {
    return InstituteModel.update({
      _id: new ObjectId(instituteId),
      deleted: false
    }, {
      $set: {
        responsiblePerson: new ObjectId(userId)
      }
    }, function(err, msg) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, msg);
    });
  };

  exports.updateInstitute = function(appUser, updateData, callback) {
    var instituteId;
    instituteId = new ObjectId(updateData._id);
    return InstituteModel.findOne({
      _id: instituteId,
      deleted: false
    }).exec(function(err, institute) {
      if (err != null) {
        return callback(err);
      }
      if (institute == null) {
        return callback('kein Institute mit der ID gefunden');
      }
      if (appUser.is('superAdmin')) {

      } else if (appUser.is('institute')) {
        if (institute.responsiblePerson.toString() !== appUser._id.toString()) {
          return callback('Es kann nur die eigene Klinik editiert werden');
        }
      } else {
        return callback('Keine Rechte die Klinik zu editieren');
      }
      if (updateData.vitabookId != null) {
        institute.vitabookId = updateData.vitabookId;
      }
      if (updateData.instituteNr != null) {
        institute.instituteNr = updateData.instituteNr;
      }
      if (updateData.name != null) {
        institute.name = updateData.name;
      }
      if (updateData.email != null) {
        institute.email = updateData.email;
      }
      if (updateData.telephone != null) {
        institute.telephone = updateData.telephone;
      }
      if (updateData.street != null) {
        institute.street = updateData.street;
      }
      if (updateData.zipcode != null) {
        institute.zipcode = updateData.zipcode;
      }
      if (updateData.city != null) {
        institute.city = updateData.city;
      }
      if (updateData.eprdClientNr != null) {
        institute.eprdClientNr = updateData.eprdClientNr;
      }
      if (updateData.eprdClientLizenz != null) {
        institute.eprdClientLizenz = updateData.eprdClientLizenz;
      }
      if (updateData.locationNr != null) {
        institute.locationNr = updateData.locationNr;
      }
      if (updateData.unitNr != null) {
        institute.unitNr = updateData.unitNr;
      }
      if (updateData.initialKey != null) {
        institute.initialKey = updateData.initialKey;
      }
      if (updateData.sendToEprd != null) {
        institute.sendToEprd = updateData.sendToEprd;
      }
      if (updateData.sendToVitabook != null) {
        institute.sendToVitabook = updateData.sendToVitabook;
      }
      institute.lastUpdated = new Date().toISOString();
      return async.parallel({
        newResponsiblePerson: function(next) {
          if (updateData.newResponsiblePerson != null) {
            return UserModel.findOne({
              _id: new ObjectId(updateData.newResponsiblePerson),
              deleted: false
            }, function(err, foundAppUser) {
              if (err != null) {
                return next(err);
              }
              if (foundAppUser == null) {
                return next('Klinikverantwortlicher nicht im System');
              }
              if (foundAppUser.permissionLevel !== 'institute') {
                return next('Klinikverantwortlicher muss Level Klinik besitzen!');
              }
              return next(null, new ObjectId(updateData.newResponsiblePerson));
            });
          } else {
            return next(null);
          }
        },
        sendToEprd: function(next) {
          var filter;
          if ((updateData.sendToEprd != null) && updateData.sendToEprd !== institute.sendToEprd) {
            filter = {
              "institute": instituteId
            };
            return ImplantModel.update(filter, {
              $set: {
                lastSyncedEprd: null
              }
            }).exec(function(err, results) {
              console.log(err, result);
              if (err != null) {
                return next(err);
              }
              return next(null);
            });
          } else {
            return next(null);
          }
        },
        sendToVitabook: function(next) {
          var filter;
          if ((updateData.sendVitabook != null) && updateData.sendVitabook !== institute.sendVitabook) {
            filter = {
              "institute": instituteId
            };
            return async.parallel({
              patients: function(next) {
                return PatientModel.update(filter, {
                  $set: {
                    lastSyncedVitabook: null
                  }
                }).exec(function(err, results) {
                  console.log(err, result);
                  if (err != null) {
                    return next(err);
                  }
                  return next(null);
                });
              },
              implants: function(next) {
                return ImplantModel.update(filter, {
                  $set: {
                    lastSyncedVitabook: null
                  }
                }).exec(function(err, results) {
                  console.log(err, result);
                  if (err != null) {
                    return next(err);
                  }
                  return next(null);
                });
              }
            }, function(err) {
              if (err != null) {
                return next(err);
              }
            });
          } else {
            return next(null);
          }
        }
      }, function(err, results) {
        if (results.newResponsiblePerson != null) {
          institute.responsiblePerson = results.newResponsiblePerson;
        }
        return saveInstitute(institute, 'updateInstitute', callback);
      });
    });
  };

  removeInstitute = function(institute, callback) {
    institute.deleted = true;
    return institute.save(function(err) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, true);
    });
  };

  exports.deleteInstitute = function(appUser, instituteId, callback) {
    return InstituteModel.findOne({
      _id: new ObjectId(instituteId),
      deleted: false
    }).exec(function(err, institute) {
      if (err) {
        return callback(err);
      }
      if (err == null) {
        err = null;
      }
      if (institute == null) {
        return callback('keine Klinik mit der ID gefunden' + instituteId);
      }
      if (appUser.is('superAdmin')) {

      } else {
        return callback('keine Berechtigung zum Löschen einer Klinik');
      }
      return UserModel.find({
        institute: instituteId
      }, function(err, users) {
        if (err) {
          return callback(err);
        }
        if ((users != null) && users.length !== 0) {
          return callback('Kliniken, die Mitarbeiter oder Patienten haben können nicht gelöscht werden!');
        }
        return removeInstitute(institute, callback);
      });
    });
  };

}).call(this);
