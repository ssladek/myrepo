(function() {
  var EprdModel, ImplantBaseDataModel, ImplantModel, InstituteModel, LocalEprdModel, LocalImplantModel, LocalPatientModel, ObjectId, PatientModel, UpdateLogModel, UserModel, apiReceiverService, async, connectionToLocalInstance, getRandomDate, helperService, inspect, mongoose, randomIntInc, registerType, seedEprdsFromLocalInstance, seedImplantsFromLocalInstance, seedPatientsFromLocalInstance, self, setResponsiblePerson;

  inspect = require('eyespect').inspector({
    maxLength: null
  });

  async = require('async');

  mongoose = require('mongoose');

  InstituteModel = require('../institute/institute.model.js');

  UserModel = require('../user/user.model.js');

  PatientModel = require('../patient/patient.model.js');

  ImplantModel = require('../implant/implant.model.js');

  EprdModel = require('../eprd/eprd.model.js');

  ImplantBaseDataModel = require('../implant-base-data/implant-base-data.model.js');

  UpdateLogModel = require('../log/update/update-log.model.js');

  ObjectId = mongoose.Types.ObjectId;

  self = this;

  if (process.env.REGISTER_TYPE === 'national') {
    registerType = 'national';
  } else {
    console.log("Register type is " + process.env.REGISTER_TYPE + " set local");
    registerType = 'local';
  }

  connectionToLocalInstance = null;

  LocalPatientModel = null;

  LocalImplantModel = null;

  LocalEprdModel = null;

  apiReceiverService = require('../api/manager/api-receiver.service.js');

  helperService = require('../helper/helper.service.js');

  exports.startSeeding = function(environment) {
    console.log("start seeding for " + environment + " & " + registerType);
    if (process.env.SEED_FLAG) {
      console.log("seed flag == " + process.env.SEED_FLAG);
    } else {
      console.log("without a SEED_FLAG");
    }
    return async.series({
      prepareDB: function(next) {
        var localDB;
        if (registerType === 'national') {
          localDB = require('../config/database.js')(environment, true);
          return connectionToLocalInstance = mongoose.createConnection(localDB.url, {
            auth: {
              authdb: localDB.authdb
            }
          }, function(err) {
            var eprdSchema, implantSchema, patientSchema;
            if (err != null) {
              return next(err);
            }
            console.log("created connection to local register for seeding");
            patientSchema = require('../patient/patient.schema.js').getSchema();
            implantSchema = require('../implant/implant.schema.js').getSchema();
            eprdSchema = require('../eprd/eprd.schema.js').getSchema();
            LocalPatientModel = connectionToLocalInstance.model('Patient', patientSchema);
            LocalImplantModel = connectionToLocalInstance.model('Implant', implantSchema);
            LocalEprdModel = connectionToLocalInstance.model('Eprd', eprdSchema);
            return next(null, null);
          });
        } else {
          return next(null, null);
        }
      },
      seed: function(next) {
        if ((environment === 'development' && process.env.SEED_FLAG === 'seedInDevelopment') || (environment === 'production' && process.env.SEED_FLAG === 'seedInProduction')) {
          return async.parallel({
            deleteInstitutes: function(next) {
              return self.deleteInstitutes(function(err, success) {
                if (err != null) {
                  return next(err);
                }
                return next(null, true);
              });
            },
            deleteUsers: function(next) {
              return self.deleteUsers(function(err, success) {
                if (err != null) {
                  return next(err);
                }
                return next(null, true);
              });
            },
            deletePatients: function(next) {
              return self.deletePatients(function(err, success) {
                if (err != null) {
                  return next(err);
                }
                return next(null, true);
              });
            },
            deleteImplants: function(next) {
              return self.deleteImplants(function(err, success) {
                if (err != null) {
                  return next(err);
                }
                return next(null, true);
              });
            },
            deleteEprds: function(next) {
              return self.deleteEprds(function(err, success) {
                if (err != null) {
                  return next(err);
                }
                return next(null, true);
              });
            },
            deleteImplantBaseData: function(next) {
              return self.deleteImplantBaseData(function(err, success) {
                if (err != null) {
                  return next(err);
                }
                return next(null, true);
              });
            },
            deleteUpdateLogs: function(next) {
              return self.deleteUpdateLogs(function(err, success) {
                if (err != null) {
                  return next(err);
                }
                return next(null, true);
              });
            }
          }, function(err, results) {
            if (err != null) {
              console.log(err);
            }
            return self.seedAllDbs(environment);
          });
        } else {
          return UserModel.findOne({
            permissionLevel: "superAdmin"
          }, function(err, userFound) {
            if (err != null) {
              return err;
            }
            if (userFound !== null) {
              return console.log("Admin already exists not seeding a new one in production");
            } else {
              return self.seedUsers(function(err, users) {
                if (err != null) {
                  console.log("Seed Err " + err);
                }
                if (users != null) {
                  return console.log("Created Admin for production");
                }
              }, true);
            }
          });
        }
      },
      closeDB: function(next) {
        if (registerType === 'national') {
          return connectionToLocalInstance.disconnect(function(err) {
            if (err != null) {
              return next(err);
            }
            return next(null, null);
          });
        } else {
          return next(null, null);
        }
      }
    }, function(err, results) {
      if (err != null) {
        console.log(err);
      }
      return console.log("FINISHED SEEDING");
    });
  };

  exports.deleteInstitutes = function(callback) {
    return InstituteModel.remove({}, function(err) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, true);
    });
  };

  exports.deleteUsers = function(callback) {
    return UserModel.remove({}, function(err) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, true);
    });
  };

  exports.deletePatients = function(callback) {
    return PatientModel.remove({}, function(err) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, true);
    });
  };

  exports.deleteImplants = function(callback) {
    return ImplantModel.remove({}, function(err) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, true);
    });
  };

  exports.deleteEprds = function(callback) {
    return EprdModel.remove({}, function(err) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, true);
    });
  };

  exports.deleteImplantBaseData = function(callback) {
    return ImplantBaseDataModel.remove({}, function(err) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, true);
    });
  };

  exports.deleteUpdateLogs = function(callback) {
    return UpdateLogModel.remove({}, function(err) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, true);
    });
  };

  exports.seedAllDbs = function(environment) {
    console.log("seeding " + environment);
    return async.series({
      institutes: function(next) {
        return self.seedInstitutes(function(err, institutes) {
          if (err != null) {
            return next(err);
          }
          return next(null, institutes);
        });
      },
      users: function(next) {
        return self.seedUsers(function(err, users) {
          if (err != null) {
            return next(err);
          }
          return next(null, users);
        });
      },
      patients: function(next) {
        if (environment === 'test') {
          return self.seedPatients(function(err, patients) {
            if (err != null) {
              return next(err);
            }
            return next(null, patients);
          });
        } else if (environment === 'development' || process.env.SEED_FLAG === 'seedInProduction') {
          if (registerType === 'national') {
            return seedPatientsFromLocalInstance(next);
          } else {
            return self.autoSeedPatients(function(err, patients) {
              if (err != null) {
                return next(err);
              }
              return next(null, patients);
            });
          }
        }
      },
      implantsAndEprds: function(next) {
        return async.series({
          implants: function(next) {
            if (environment === 'test') {
              return self.seedImplants(function(err, implants) {
                if (err != null) {
                  return next(err);
                }
                return next(null, implants);
              });
            } else if (environment === 'development' || process.env.SEED_FLAG === 'seedInProduction') {
              if (registerType === 'national') {
                return seedImplantsFromLocalInstance(next);
              } else {
                return self.autoSeedImplants(function(err, implants) {
                  if (err != null) {
                    return next(err);
                  }
                  return next(null, implants);
                });
              }
            }
          },
          eprds: function(next) {
            if (environment === 'test') {
              return self.seedEprds(function(err, eprds) {
                if (err != null) {
                  return next(err);
                }
                return next(null, eprds);
              });
            } else if (environment === 'development' || process.env.SEED_FLAG === 'seedInProduction') {
              if (registerType === 'national') {
                return seedEprdsFromLocalInstance(next);
              } else {
                return self.seedEprds(function(err, eprds) {
                  if (err != null) {
                    return next(err);
                  }
                  return next(null, eprds);
                });
              }
            }
          }
        }, function(err, results) {
          if (err != null) {
            return next(err);
          }
          return next(null, results.implants);
        });
      },
      implantBaseData: function(next) {
        if (environment === 'test') {
          return self.seedImplantBaseData(function(err, implantBaseData) {
            if (err != null) {
              return next(err);
            }
            return next(null, implantBaseData);
          });
        } else if (environment === 'development' || process.env.SEED_FLAG === 'seedInProduction') {
          if (registerType === 'national') {
            return self.seedImplantBaseData(function(err, implantBaseData) {
              if (err != null) {
                return next(err);
              }
              return next(null, implantBaseData);
            });
          }
        }
      }
    }, function(err, results) {
      if (err != null) {
        console.log(err);
      }
      console.log("=================================================================");
      return console.log("finished seeding");
    });
  };

  setResponsiblePerson = function(userId, instituteId, callback) {
    return InstituteModel.update({
      _id: new ObjectId(instituteId)
    }, {
      $set: {
        responsiblePerson: new ObjectId(userId)
      }
    }, function(err) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, userId);
    });
  };

  exports.seedInstitutes = function(callback) {
    var institutes;
    institutes = require('./seed-institutes.json');
    return async.mapSeries(institutes, function(institute, next) {
      var newInstitute;
      newInstitute = new InstituteModel();
      if (institute._id != null) {
        newInstitute._id = new ObjectId(institute._id);
      }
      if (institute.vitabookId != null) {
        newInstitute.vitabookId = institute.vitabookId;
      }
      if (institute.instituteNr != null) {
        newInstitute.instituteNr = institute.instituteNr;
      }
      if (institute.name != null) {
        newInstitute.name = institute.name;
      }
      if (institute.telephone != null) {
        newInstitute.telephone = institute.telephone;
      }
      if (institute.email != null) {
        newInstitute.email = institute.email;
      }
      if (institute.street != null) {
        newInstitute.street = institute.street;
      }
      if (institute.zipcode != null) {
        newInstitute.zipcode = institute.zipcode;
      }
      if (institute.city != null) {
        newInstitute.city = institute.city;
      }
      if (institute.responsiblePerson != null) {
        newInstitute.responsiblePerson = new ObjectId(institute.responsiblePerson);
      }
      newInstitute.baseUrl = institute.baseUrl != null ? institute.baseUrl : helperService.getIp();
      if (institute.sendToEprd != null) {
        newInstitute.sendToEprd = institute.sendToEprd;
      }
      if (institute.sendToVitabook != null) {
        newInstitute.sendToVitabook = institute.sendToVitabook;
      }
      if (institute.deleted != null) {
        newInstitute.deleted = institute.deleted;
      }
      newInstitute.lastSyncedManager = institute.lastSyncedManager != null ? institute.lastSyncedManager : new Date();
      if (institute.eprdClientNr != null) {
        newInstitute.eprdClientNr = institute.eprdClientNr;
      }
      if (institute.eprdClientLizenz != null) {
        newInstitute.eprdClientLizenz = institute.eprdClientLizenz;
      }
      if (institute.locationNr != null) {
        newInstitute.locationNr = institute.locationNr;
      }
      if (institute.unitNr != null) {
        newInstitute.unitNr = institute.unitNr;
      }
      if (institute.initialKey != null) {
        newInstitute.initialKey = institute.initialKey;
      }
      return newInstitute.save(function(err) {
        if (err != null) {
          console.log(err);
        }
        if (err != null) {
          return callback(err);
        }
        if (err == null) {
          err = null;
        }
        return next(err, newInstitute._id);
      });
    }, function(err, instituteIds) {
      if (err) {
        return callback(err);
      } else {
        return callback(null, instituteIds);
      }
    });
  };

  exports.seedUsers = function(callback, onlyAdmin) {
    var admin, i, len, user, userIds, users;
    users = require('./seed-users.json');
    if ((onlyAdmin != null) && onlyAdmin === true) {
      for (i = 0, len = users.length; i < len; i++) {
        user = users[i];
        if (user._id.toString() === "55a7645de07f6a835badb81a") {
          admin = user;
        }
      }
      users = [];
      users.unshift(admin);
    }
    if ((users == null) || users.length === 0) {
      return callback("Keine User zum seeden vorhanden");
    }
    userIds = [];
    return async.mapSeries(users, function(user, next) {
      var filter, newUser;
      newUser = {};
      if (user.vitabookId != null) {
        newUser.vitabookId = user.vitabookId;
      }
      if (registerType === 'local') {
        if (user._id != null) {
          newUser._id = new ObjectId(user._id);
        }
      } else if (registerType === 'national') {
        if (user._id != null) {
          newUser.refId = new ObjectId(user._id);
        }
      }
      if (user.permissionLevel != null) {
        newUser.permissionLevel = user.permissionLevel;
      }
      if (user.gender != null) {
        newUser.gender = user.gender;
      }
      if (user.institute != null) {
        newUser.institute = new ObjectId(user.institute);
      }
      if (user.gender != null) {
        newUser.gender = user.gender;
      }
      if (user.lastName != null) {
        newUser.lastName = user.lastName;
      }
      if (user.firstName != null) {
        newUser.firstName = user.firstName;
      }
      if (user.permissionLevel != null) {
        newUser.permissionLevel = user.permissionLevel;
      }
      if (user.field != null) {
        newUser.field = user.field;
      }
      if (user.telephone != null) {
        newUser.telephone = user.telephone;
      }
      if (user.mobile != null) {
        newUser.mobile = user.mobile;
      }
      if (user.email != null) {
        newUser.email = user.email;
      }
      if (user.token != null) {
        newUser.token = user.token;
      }
      if (user.password != null) {
        newUser.password = new UserModel().generateHash(user.password);
      }
      if (user.password != null) {
        newUser.vitabookPassword = new UserModel().generateVitabookPassword(user.password);
      }
      if (user.street != null) {
        newUser.street = user.street;
      }
      if (user.zipcode != null) {
        newUser.zipcode = user.zipcode;
      }
      if (user.city != null) {
        newUser.city = user.city;
      }
      if (user.active != null) {
        newUser.active = user.active;
      }
      if (user.deleted != null) {
        newUser.deleted = user.deleted;
      }
      filter = {};
      if (registerType === 'local') {
        filter._id = newUser._id;
      } else if (registerType === 'national') {
        filter.refId = newUser.refId;
      }
      return UserModel.update(filter, newUser, {
        upsert: true,
        "new": true
      }, function(err, user) {
        var id;
        if (err != null) {
          if (err.code === 11000) {
            return next('Emailadresse ist bereits registriert');
          }
          return next(err);
        }
        userIds.push(newUser._id);
        if (newUser.responsibleForInstituteId != null) {
          id = registerType === 'local' ? newUser._id : newUser.refId;
          return setResponsiblePerson(id, newUser.responsibleForInstituteId, next);
        } else {
          return next(null);
        }
      });
    }, function(err, userIds) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, userIds);
    });
  };

  exports.seedPatients = function(callback) {
    var patients;
    patients = require('./seed-patients.json');
    return async.mapSeries(patients, function(patient, next) {
      var newPatient;
      newPatient = new PatientModel();
      if (patient.vitabookId != null) {
        newPatient.vitabookId = patient.vitabookId;
      }
      if (patient._id != null) {
        newPatient._id = new ObjectId(patient._id);
      }
      if (patient.sendToEprd != null) {
        newPatient.sendToEprd = patient.sendToEprd;
      }
      if (patient.sendToVitabook != null) {
        newPatient.sendToVitabook = patient.sendToVitabook;
      }
      if (patient.patientId != null) {
        newPatient.patientId = patient.patientId;
      }
      if (patient.implantCardId != null) {
        newPatient.implantCardId = patient.implantCardId;
      }
      if (patient.implantCardSecurity != null) {
        newPatient.implantCardSecurity = patient.implantCardSecurity;
      }
      if (patient.gender != null) {
        newPatient.gender = patient.gender;
      }
      if (patient.lastName != null) {
        newPatient.lastName = patient.lastName;
      }
      if (patient.firstName != null) {
        newPatient.firstName = patient.firstName;
      }
      if (patient.birthdate != null) {
        newPatient.birthdate = new Date(patient.birthdate);
      }
      if (patient.insurance != null) {
        newPatient.insurance = patient.insurance;
      }
      if (patient.insurant != null) {
        newPatient.insurant = patient.insurant;
      }
      if (patient.telephone != null) {
        newPatient.telephone = patient.telephone;
      }
      if (patient.mobile != null) {
        newPatient.mobile = patient.mobile;
      }
      if (patient.email != null) {
        newPatient.email = patient.email;
      }
      if (patient.street != null) {
        newPatient.street = patient.street;
      }
      if (patient.zipcode != null) {
        newPatient.zipcode = patient.zipcode;
      }
      if (patient.city != null) {
        newPatient.city = patient.city;
      }
      if (patient.institute != null) {
        newPatient.institute = new ObjectId(patient.institute);
      }
      if (patient.field != null) {
        newPatient.field = patient.field;
      }
      if (patient.saveDate != null) {
        newPatient.saveDate = patient.saveDate;
      }
      if (patient.creator != null) {
        newPatient.creator = new ObjectId(patient.creator);
      }
      if (patient.deleted != null) {
        newPatient.deleted = patient.deleted;
      }
      return newPatient.save(function(err, newPatient) {
        if (err != null) {
          return callback(err);
        }
        return next(null, newPatient._id);
      });
    }, function(err, patientIds) {
      if (err != null) {
        return callback(err);
      } else {
        return callback(null, patientIds);
      }
    });
  };

  exports.seedImplants = function(callback) {
    var implants;
    implants = require('./seed-implants.json');
    return async.mapSeries(implants, function(implant, next) {
      var newImplant;
      newImplant = new ImplantModel();
      if (implant.vitabookId != null) {
        newImplant.vitabookId = implant.vitabookId;
      }
      if (implant._id != null) {
        newImplant._id = new ObjectId(implant._id);
      }
      if (implant.patient != null) {
        newImplant.patient = new ObjectId(implant.patient);
      }
      if (implant.bodyPart != null) {
        newImplant.bodyPart = implant.bodyPart;
      }
      if (implant.art != null) {
        newImplant.art = implant.art;
      }
      if (implant.manufacturer != null) {
        newImplant.manufacturer = implant.manufacturer;
      }
      if (implant.referenceNr != null) {
        newImplant.referenceNr = implant.referenceNr;
      }
      if (implant.model != null) {
        newImplant.model = implant.model;
      }
      if (implant.type != null) {
        newImplant.type = implant.type;
      }
      if (implant.lot != null) {
        newImplant.lot = implant.lot;
      }
      if (implant.serialNr != null) {
        newImplant.serialNr = implant.serialNr;
      }
      if (implant.operationId != null) {
        newImplant.operationId = implant.operationId;
      }
      if (implant.operationName != null) {
        newImplant.operationName = implant.operationName;
      }
      if (implant.materialNr != null) {
        newImplant.materialNr = implant.materialNr;
      }
      if (implant.storage != null) {
        newImplant.storage = implant.storage;
      }
      if (implant.creator != null) {
        newImplant.creator = new ObjectId(implant.creator);
      }
      if (implant.institute != null) {
        newImplant.institute = new ObjectId(implant.institute);
      }
      if (implant.field != null) {
        newImplant.field = implant.field;
      }
      if (implant.controllDate != null) {
        newImplant.controllDate = new Date(implant.controllDate);
      }
      if (implant.imOrExplant != null) {
        newImplant.imOrExplant = implant.imOrExplant;
      }
      if (implant.comment != null) {
        newImplant.comment = implant.comment;
      }
      if (implant.deleted != null) {
        newImplant.deleted = implant.deleted;
      }
      return newImplant.save(function(err, newImplant) {
        if (err != null) {
          return next(err);
        }
        return next(null, newImplant._id);
      });
    }, function(err, implantIds) {
      if (err != null) {
        return callback(err);
      } else {
        return callback(null, implantIds);
      }
    });
  };

  exports.seedEprds = function(callback) {
    var eprds;
    eprds = require('./seed-eprds.json');
    return async.mapSeries(eprds, function(eprd, next) {
      if (eprd.institute == null) {
        return next("EPRD Datensatz besitzt keine Klinik");
      }
      return ImplantModel.findOne({
        institute: new ObjectId(eprd.institute)
      }).select({
        _id: 1
      }).exec(function(err, implantId) {
        var newEprd;
        newEprd = new EprdModel();
        newEprd.implant = implantId;
        if (eprd._id != null) {
          newEprd._id = new ObjectId(eprd._id);
        }
        if (eprd.menge != null) {
          newEprd.menge = eprd.menge;
        }
        if (eprd.einheit != null) {
          newEprd.einheit = eprd.einheit;
        }
        if (eprd.artikeltyp != null) {
          newEprd.artikeltyp = eprd.artikeltyp;
        }
        if (eprd.gelenk != null) {
          newEprd.gelenk = eprd.gelenk;
        }
        if (eprd.seite != null) {
          newEprd.seite = eprd.seite;
        }
        if (eprd.arteingriff != null) {
          newEprd.arteingriff = eprd.arteingriff;
        }
        if (eprd.hersteller != null) {
          newEprd.hersteller = eprd.hersteller;
        }
        if (eprd.vorop != null) {
          newEprd.vorop = eprd.vorop;
        }
        if (eprd.wechselgrund != null) {
          newEprd.wechselgrund = eprd.wechselgrund;
        }
        if (eprd.zweizeitwechsel != null) {
          newEprd.zweizeitwechsel = eprd.zweizeitwechsel;
        }
        if (eprd.institute != null) {
          newEprd.institute = new ObjectId(eprd.institute);
        }
        if (eprd.deleted != null) {
          newEprd.deleted = eprd.deleted;
        }
        return newEprd.save(function(err, newEprd) {
          if (err != null) {
            return next(err);
          }
          console.log(newEprd._id);
          return next(null, newEprd._id);
        });
      });
    }, function(err, eprdIds) {
      if (err != null) {
        return callback(err);
      } else {
        return callback(null, eprdIds);
      }
    });
  };

  exports.seedImplantBaseData = function(callback) {
    var implantBaseData;
    implantBaseData = require('./seed-implant-base-data.json');
    return async.mapSeries(implantBaseData, function(implantBaseDataUnit, next) {
      var newImplantBaseData;
      newImplantBaseData = new ImplantBaseDataModel();
      if (implantBaseDataUnit._id != null) {
        newImplantBaseData._id = new ObjectId(implantBaseDataUnit._id);
      }
      if (implantBaseDataUnit.art != null) {
        newImplantBaseData.art = implantBaseDataUnit.art;
      }
      if (implantBaseDataUnit.manufacturer != null) {
        newImplantBaseData.manufacturer = implantBaseDataUnit.manufacturer;
      }
      if (implantBaseDataUnit.referenceNr != null) {
        newImplantBaseData.referenceNr = implantBaseDataUnit.referenceNr;
      }
      if (implantBaseDataUnit.model != null) {
        newImplantBaseData.model = implantBaseDataUnit.model;
      }
      if (implantBaseDataUnit.type != null) {
        newImplantBaseData.type = implantBaseDataUnit.type;
      }
      if (implantBaseDataUnit.lastUpdated != null) {
        newImplantBaseData.lastUpdated = implantBaseDataUnit.lastUpdated;
      }
      if (implantBaseDataUnit.saveDate != null) {
        newImplantBaseData.saveDate = implantBaseDataUnit.saveDate;
      }
      return newImplantBaseData.save(function(err, newImplantBaseData) {
        if (err != null) {
          return next(err);
        }
        return next(null, newImplantBaseData._id);
      });
    }, function(err, implantBaseDataIds) {
      if (err != null) {
        return callback(err);
      } else {
        return callback(null, implantBaseDataIds);
      }
    });
  };

  randomIntInc = function(low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
  };

  getRandomDate = function(from, to) {
    if (!from) {
      from = new Date(1900, 0, 1).getTime();
    } else if (from === 'now') {
      from = new Date().getTime();
    } else {
      from = new Date(from).getTime();
    }
    if (!to) {
      to = new Date(2100, 0, 1).getTime();
    } else if (to === 'now') {
      to = new Date().getTime();
    } else {
      to = new Date(to).getTime();
    }
    return new Date(from + Math.random() * (to - from));
  };

  exports.autoSeedPatients = function(callback) {
    var autoSeed, numberPatientsSeeds;
    autoSeed = require('./auto-seed-patients.json');
    numberPatientsSeeds = process.env.COUNT_PATIENT_SEEDS || 100;
    return UserModel.find({
      permissionLevel: 'employee'
    }, function(err, usersFound) {
      if ((usersFound == null) || usersFound.length === 0) {
        return callback("Keine User für Autoseed vorhanden!");
      }
      return async.times(numberPatientsSeeds, function(index, next) {
        var creatorRandom, currentDate, genderOptions, newPatient, patientGenderRandom;
        newPatient = new PatientModel();
        newPatient.patientId = (100000 + index).toString();
        newPatient.implantCardId = randomIntInc(1000000, 9000000).toString();
        newPatient.implantCardSecurity = randomIntInc(100, 999).toString();
        genderOptions = ['Frau', 'Herr'];
        patientGenderRandom = randomIntInc(0, 1);
        newPatient.gender = genderOptions[patientGenderRandom];
        newPatient.lastName = autoSeed.lastNamesI[randomIntInc(0, autoSeed.lastNamesI.length - 1)] + autoSeed.lastNamesII[randomIntInc(0, autoSeed.lastNamesII.length - 1)];
        if (patientGenderRandom === 0) {
          newPatient.firstName = autoSeed.firstNamesFemale[randomIntInc(0, autoSeed.firstNamesFemale.length - 1)];
        } else if (patientGenderRandom === 1) {
          newPatient.firstName = autoSeed.firstNamesMale[randomIntInc(0, autoSeed.firstNamesMale.length - 1)];
        }
        newPatient.birthdate = getRandomDate('1920-01-01', '1970-12-01');
        newPatient.sendToEprd = true;
        newPatient.sendToVitabook = true;
        newPatient.insurance = autoSeed.insurances[randomIntInc(0, autoSeed.insurances.length - 1)];
        newPatient.insurant = randomIntInc(10000000, 90000000).toString();
        newPatient.telephone = "0" + randomIntInc(0, 100) + "/" + randomIntInc(10000000, 90000000);
        newPatient.mobile = "017" + randomIntInc(100000, 900000);
        newPatient.email = newPatient.firstName + '.' + newPatient.lastName + '@autofokus-marketing.de';
        newPatient.street = autoSeed.streetNamesI[randomIntInc(0, autoSeed.streetNamesI.length - 1)] + autoSeed.streetNamesII[randomIntInc(0, autoSeed.streetNamesII.length - 1)] + " " + autoSeed.streetNamesIII[randomIntInc(0, autoSeed.streetNamesIII.length - 1)] + " " + randomIntInc(0, 40);
        newPatient.zipcode = randomIntInc(10000, 90000);
        newPatient.city = autoSeed.cities[randomIntInc(0, autoSeed.cities.length - 1)];
        creatorRandom = randomIntInc(0, usersFound.length - 1);
        newPatient.institute = new ObjectId(usersFound[creatorRandom].institute);
        newPatient.field = usersFound[creatorRandom].field;
        currentDate = new Date();
        newPatient.saveDate = new Date(currentDate.setMonth(-randomIntInc(0, 24)));
        newPatient.creator = new ObjectId(usersFound[creatorRandom].id);
        newPatient.deleted = false;
        return newPatient.save(function(err, newPatient) {
          if (err != null) {
            return callback(err);
          }
          return next(null, newPatient._id);
        });
      }, function(err, patientIds) {
        if (err != null) {
          console.log(err);
          return callback(err);
        }
        console.log(patientIds.length + " patients seeded");
        return callback(null, patientIds);
      });
    });
  };

  exports.seedUpdateLogs = function(callback) {
    var updateLogs;
    updateLogs = require('./seed-update-logs.json');
    return async.mapSeries(updateLogs, function(updateLog, next) {
      var newUpdateLog;
      newUpdateLog = new UpdateLogModel();
      if (updateLog._id != null) {
        newUpdateLog._id = new ObjectId(updateLog._id);
      }
      if (updateLog.from != null) {
        newUpdateLog.from = updateLog.from;
      }
      if (updateLog.to != null) {
        newUpdateLog.to = updateLog.to;
      }
      if (updateLog.operation != null) {
        newUpdateLog.operation = updateLog.operation;
      }
      if (updateLog.success != null) {
        newUpdateLog.success = updateLog.success;
      }
      if (updateLog.saveDate != null) {
        newUpdateLog.saveDate = new Date(updateLog.saveDate);
      }
      newUpdateLog.customer = registerType === 'national' ? 'National' : process.env.CUSTOMER || 'unbekannt';
      return newUpdateLog.save(function(err) {
        if (err != null) {
          console.log(err);
        }
        if (err != null) {
          return next(err);
        }
        return next(null, newUpdateLog._id);
      });
    }, function(err, updateLogsIds) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, updateLogsIds);
    });
  };

  exports.autoSeedImplants = function(callback) {
    var autoSeed, autoSeedRealData, highestSerial, lastOperationId, numberImplantSeeds, numberLot, operationFinished, operationId, serialStep;
    autoSeed = require('./auto-seed-implants.json');
    autoSeedRealData = require('./auto-seed-implants-real.json');
    numberImplantSeeds = process.env.COUNT_IMPLANT_SEEDS || 1000;
    operationFinished = true;
    lastOperationId = 2000;
    operationId = null;
    numberLot = 5;
    serialStep = 100;
    highestSerial = 1000000;
    return UserModel.find({
      permissionLevel: 'employee'
    }, function(err, usersFound) {
      if ((usersFound == null) || (usersFound != null) && usersFound.length === 0) {
        return callback("Keine User für Autoseed vorhanden!");
      }
      return PatientModel.find({
        institute: new ObjectId("55a76190bcdb4a82585c8e9d")
      }, function(err, patients) {
        if (err != null) {
          console.log(err);
        }
        if (err != null) {
          return callback(err);
        }
        if ((patients == null) || patients.length === 0) {
          return 'No patients found';
        }
        return async.times(numberImplantSeeds, function(index, next) {
          var creatorRandom, currentDate, implantRandom, implantRandomReal, newImplant, patientDate, patientRandom, serialNrRandom;
          newImplant = new ImplantModel();
          patientRandom = randomIntInc(0, patients.length - 1);
          newImplant.patient = new ObjectId(patients[patientRandom]._id);
          implantRandom = Math.floor(index * (autoSeed.implants.length - 1) / numberImplantSeeds);
          newImplant.referenceNr = autoSeed.implants[implantRandom].referenceNr;
          newImplant.bodyPart = autoSeed.implants[implantRandom].bodyPart;
          implantRandomReal = Math.floor(index * (autoSeedRealData.length - 1) / numberImplantSeeds);
          newImplant.art = autoSeedRealData[implantRandomReal].art;
          newImplant.materialNr = autoSeedRealData[implantRandomReal].materialNr;
          newImplant.manufacturer = autoSeedRealData[implantRandomReal].manufacturer;
          newImplant.storage = autoSeedRealData[implantRandomReal].storage;
          newImplant.lot = Math.floor((index - implantRandom * ((autoSeed.implants.length - 1) / numberImplantSeeds)) / (numberImplantSeeds / patients.length)) + 1000000;
          serialNrRandom = randomIntInc(highestSerial, highestSerial + serialStep);
          highestSerial = serialNrRandom;
          newImplant.serialNr = serialNrRandom;
          while (true) {
            patientDate = new Date(patients[patientRandom].saveDate);
            newImplant.saveDate = new Date(patientDate.setMonth(randomIntInc(0, 24)));
            if (!(newImplant.saveDate > new Date())) {
              break;
            }
          }
          if (operationFinished === true) {
            operationId = randomIntInc(lastOperationId + 1, lastOperationId + 50);
          }
          if ((randomIntInc(0, 100) > 50) && operationFinished === true) {
            newImplant.operationId = null;
            newImplant.operationFinished = true;
          } else {
            operationFinished = false;
            if (randomIntInc(0, 100) > 40) {
              operationFinished = true;
            }
            newImplant.operationId = operationId.toString();
            lastOperationId = operationId;
            newImplant.operationFinished = operationFinished;
          }
          newImplant.operationName = newImplant.art + 'Operation';
          newImplant.materialNr = autoSeed.implants[implantRandom].materialNr;
          newImplant.storage = autoSeed.implants[implantRandom].storage;
          creatorRandom = randomIntInc(0, usersFound.length - 1);
          newImplant.creator = new ObjectId(usersFound[creatorRandom]._id);
          newImplant.institute = new ObjectId(usersFound[creatorRandom].institute);
          newImplant.field = patients[patientRandom].field;
          currentDate = new Date();
          newImplant.controllDate = new Date(currentDate.setMonth(currentDate.getMonth() + randomIntInc(1, 48)));
          if (randomIntInc(0, 100) < 5) {
            newImplant.imOrExplant = 'Explant';
          } else {
            newImplant.imOrExplant = 'Implant';
          }
          newImplant.deleted = false;
          return newImplant.save(function(err, newImplant) {
            if (err != null) {
              console.log(err);
            }
            if (err != null) {
              return callback(err);
            }
            if (err == null) {
              err = null;
            }
            return next(err, newImplant._id);
          });
        }, function(err, implantIds) {
          if (err != null) {
            console.log(err);
            return callback(err);
          }
          console.log(implantIds.length + " implants seeded");
          return callback(null, implantIds);
        });
      });
    });
  };

  seedPatientsFromLocalInstance = function(callback) {
    return LocalPatientModel.find({}).lean().exec(function(err, patients) {
      if (err != null) {
        return callback(err);
      }
      console.log("seeding patients from local instance");
      return apiReceiverService.createOrUpdatePatients(patients, callback);
    });
  };

  seedImplantsFromLocalInstance = function(callback) {
    return LocalImplantModel.find({}).lean().exec(function(err, implants) {
      if (err != null) {
        return callback(err);
      }
      console.log("seeding implants from local instance");
      return apiReceiverService.createOrUpdateImplants(implants, callback);
    });
  };

  seedEprdsFromLocalInstance = function(callback) {
    return LocalEprdModel.find({}).lean().exec(function(err, eprds) {
      if (err != null) {
        return callback(err);
      }
      console.log("seeding eprds from local instance");
      return apiReceiverService.createOrUpdateEprds(eprds, callback);
    });
  };

}).call(this);
