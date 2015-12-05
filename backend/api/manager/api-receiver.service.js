(function() {
  var ChangeLogModel, EprdModel, ImplantBaseDataModel, ImplantModel, InstituteModel, ObjectId, PatientModel, UpdateLogModel, UserModel, async, saveInstitute;

  async = require('async');

  InstituteModel = require('../../institute/institute.model.js');

  UserModel = require('../../user/user.model.js');

  PatientModel = require('../../patient/patient.model.js');

  ImplantModel = require('../../implant/implant.model.js');

  ImplantBaseDataModel = require('../../implant-base-data/implant-base-data.model.js');

  EprdModel = require('../../eprd/eprd.model.js');

  UpdateLogModel = require('../../log/update/update-log.model.js');

  ChangeLogModel = require('../../log/change/change-log.model.js');

  ObjectId = require('mongoose').Types.ObjectId;

  saveInstitute = function(institute, callback) {
    return institute.save(function(err) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, institute._id);
    });
  };

  exports.getInitial = function(appUser, initialKey, callback) {
    var filterInstitute, filterUsers;
    if (appUser.is('superAdmin')) {

    } else {
      return callback('Keine Berechtigung zum Abfragen der ersten Klinik');
    }
    filterInstitute = {};
    filterUsers = {};
    filterInstitute.initialKey = initialKey;
    console.log("filterInstitute", filterInstitute);
    return async.series({
      institute: function(next) {
        return InstituteModel.findOne(filterInstitute, function(err, institute) {
          if (err != null) {
            return next(err);
          }
          if (institute == null) {
            return next("Keine Klinik gefunden");
          }
          filterUsers.institute = institute._id;
          return next(null, institute);
        });
      },
      users: function(next) {
        console.log("filterUsers", JSON.stringify(filterUsers));
        return UserModel.find(filterUsers, function(err, users) {
          if (err != null) {
            return next(err);
          }
          return next(null, users);
        });
      }
    }, function(err, results) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, {
        "institute": results.institute,
        "users": results.users
      });
    });
  };

  exports.createOrUpdateInstitutes = function(institutes, callback) {
    var instituteIds;
    instituteIds = [];
    return async.each(institutes, function(institute, next) {
      if ((institute._id == null) || institute._id === '') {
        return callback("Keine Id vorhanden");
      }
      delete institute.__v;
      return InstituteModel.findOneAndUpdate({
        _id: new ObjectId(institute._id),
        deleted: false
      }, institute, {
        'upsert': true,
        'new': true
      }, function(err, instituteFound) {
        if (err != null) {
          return next(err);
        }
        instituteIds.push({
          "_id": instituteFound._id.toString()
        });
        return next(null);
      });
    }, function(err) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, instituteIds);
    });
  };

  exports.createOrUpdateUsers = function(users, callback) {
    var userIds;
    userIds = [];
    return async.each(users, function(user, next) {
      if ((user._id == null) || user._id === '' || (user.institute == null) || user.institute === '') {
        return callback("Keine id und/oder Klinik vorhanden");
      }
      user.refId = user._id;
      delete user._id;
      delete user.__v;
      return UserModel.findOneAndUpdate({
        refId: new ObjectId(user.refId),
        institute: new ObjectId(user.institute),
        deleted: false
      }, user, {
        'upsert': true,
        'new': true
      }, function(err, userFound) {
        if (err != null) {
          return next(err);
        }
        userIds.push({
          "_id": userFound.refId.toString(),
          "refId": userFound._id.toString()
        });
        return next(null);
      });
    }, function(err) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, userIds);
    });
  };

  exports.updateUser = function(user, callback) {
    user.refId = user._id;
    delete user._id;
    return UserModel.findOneAndUpdate({
      refId: new ObjectId(user.refId),
      institute: new ObjectId(user.institute),
      deleted: false
    }, user, {
      'new': true
    }, function(err, result) {
      if (err != null) {
        return callback(err);
      }
      if (result === null) {
        return callback("kein Nutzer mit der refId " + user._id + " & KlinikId " + user.institute + " gefunden");
      }
      return callback(null, result);
    });
  };

  exports.createOrUpdatePatients = function(patients, callback) {
    var patientIds;
    patientIds = [];
    return async.each(patients, function(patient, next) {
      if ((patient._id == null) || patient._id === '' || (patient.institute == null) || patient.institute === '') {
        return callback("Keine id und/oder Klinik vorhanden");
      }
      patient.refId = patient._id;
      delete patient._id;
      delete patient.__v;
      return PatientModel.findOneAndUpdate({
        refId: new ObjectId(patient.refId),
        institute: new ObjectId(patient.institute),
        deleted: false
      }, patient, {
        'upsert': true,
        'new': true
      }, function(err, patientFound) {
        if (err != null) {
          return next(err);
        }
        patientIds.push({
          "_id": patientFound.refId.toString(),
          "refId": patientFound._id.toString()
        });
        return next(null);
      });
    }, function(err) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, patientIds);
    });
  };

  exports.createOrUpdateImplants = function(implants, callback) {
    var implantIds;
    implantIds = [];
    return async.each(implants, function(implant, next) {
      if ((implant._id == null) || implant._id === '' || (implant.institute == null) || implant.institute === '') {
        return callback("Keine id und/oder Klinik vorhanden");
      }
      implant.refId = implant._id;
      delete implant._id;
      delete implant.__v;
      return ImplantModel.findOneAndUpdate({
        refId: new ObjectId(implant.refId),
        institute: new ObjectId(implant.institute),
        deleted: false
      }, implant, {
        'upsert': true,
        'new': true
      }, function(err, implantFound) {
        if (err != null) {
          return next(err);
        }
        implantIds.push({
          "_id": implantFound.refId.toString(),
          "refId": implantFound._id.toString()
        });
        return next(null);
      });
    }, function(err) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, implantIds);
    });
  };

  exports.createOrUpdateEprds = function(eprds, callback) {
    var eprdIds;
    eprdIds = [];
    return async.each(eprds, function(eprd, next) {
      if ((eprd._id == null) || eprd._id === '' || (eprd.implant == null) || eprd.implant === '') {
        return callback("Keine Id und/oder Implantat-Id vorhanden");
      }
      eprd.refId = eprd._id;
      delete eprd._id;
      delete eprd.__v;
      return EprdModel.findOneAndUpdate({
        refId: new ObjectId(eprd.refId),
        institute: new ObjectId(eprd.institute),
        deleted: false
      }, eprd, {
        'upsert': true,
        'new': true
      }).lean().exec(function(err, eprdFound) {
        if (err != null) {
          return next(err);
        }
        eprdIds.push({
          "_id": eprdFound.refId.toString(),
          "refId": eprdFound._id.toString()
        });
        return next(null);
      });
    }, function(err) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, eprdIds);
    });
  };

  exports.readImplantBaseData = function(startDate, callback) {
    var filter;
    if (startDate !== 'none') {
      startDate = new Date(startDate);
      startDate.setSeconds(startDate.getSeconds() + 1);
      filter = {
        "lastUpdated": {
          "$gt": startDate
        }
      };
    } else {
      filter = {};
    }
    return ImplantBaseDataModel.find(filter, function(err, implantBaseData) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, implantBaseData);
    });
  };

  exports.createOrUpdateImplantBaseData = function(implantBaseDataStack, callback) {
    return async.each(implantBaseDataStack, function(implantBaseData, next) {
      delete implantBaseData._id;
      return ImplantBaseDataModel.findOneAndUpdate({
        referenceNr: implantBaseData.referenceNr
      }, implantBaseData, {
        upsert: true,
        "new": true
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
      return callback(null, true);
    });
  };

  exports.createOrUpdateLogs = function(type, logs, callback) {
    var Model, logIds;
    logIds = [];
    if (type === 'changeLogs') {
      Model = ChangeLogModel;
    } else if (type === 'updateLogs') {
      Model = UpdateLogModel;
    } else {
      return callback(type + " is no valid log type");
    }
    return async.each(logs, function(log, next) {
      if ((log._id == null) || log._id === '') {
        return callback("Keine Id vorhanden");
      }
      log.refId = log._id;
      delete log._id;
      delete log.__v;
      return Model.findOneAndUpdate({
        refId: new ObjectId(log.refId),
        customer: log.customer
      }, log, {
        'upsert': true,
        'new': true
      }, function(err, logFound) {
        if (err != null) {
          return next(err);
        }
        logIds.push({
          "_id": logFound.refId.toString(),
          "refId": logFound._id.toString()
        });
        return next(null);
      });
    }, function(err) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, logIds);
    });
  };

}).call(this);
