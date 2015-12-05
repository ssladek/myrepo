(function() {
  var ImplantBaseDataModel, ObjectId, UserModel, apiSenderService, async, configDB, environment, registerConfig, registerType, removeImplantBaseData, saveImplantBaseData, self, updateLogService;

  async = require('async');

  environment = require('../config/config.js')();

  registerConfig = require('../config/register-config.js');

  registerType = registerConfig.getType();

  configDB = require('../config/database.js')(environment);

  apiSenderService = require('../api/manager/api-sender.service.js');

  updateLogService = require('../log/update/update-log.service.js');

  UserModel = require('../user/user.model.js');

  ImplantBaseDataModel = require('./implant-base-data.model.js');

  ObjectId = require('mongoose').Types.ObjectId;

  self = this;

  exports.createUpdateLog = function(appUser, from, to, success, callback) {
    return updateLogService.createLog(appUser, from, to, 'implantBaseData', success, function(err, result) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, true);
    });
  };

  exports.transferImplantBaseDataToNationalRegister = function(appUser, lastUpdated, callback) {
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
    return ImplantBaseDataModel.find(filter).lean().exec(function(err, implantBaseDataFound) {
      if (err != null) {
        return callback(err);
      }
      if ((implantBaseDataFound != null) && implantBaseDataFound.length > 0) {
        return apiSenderService.send(environment, 'createOrUpdateImplantBaseData', implantBaseDataFound, appUserToken, function(err, success) {
          if (err != null) {
            return callback(err);
          }
          return self.createUpdateLog(appUser, 'local', 'national', true, function(err, result) {
            if (err != null) {
              return callback(err);
            }
            return callback(null, true);
          });
        });
      } else {
        return self.createUpdateLog(appUser, 'local', 'national', true, function(err, result) {
          if (err != null) {
            return callback(err);
          }
          return callback(null, 'nothing to transfer');
        });
      }
    });
  };

  saveImplantBaseData = function(implantbasedata, method, callback) {
    return implantbasedata.save(function(err, implantBaseDataSaved) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, implantBaseDataSaved);
    });
  };

  exports.createImplantBaseData = function(appUser, implantBaseDataNewData, callback) {
    return ImplantBaseDataModel.findOne({
      referenceNr: implantBaseDataNewData.referenceNr
    }, function(err, implantBaseData) {
      var isNew;
      if (err != null) {
        return callback(err);
      }
      if (implantBaseData === null) {
        implantBaseData = new ImplantBaseDataModel();
        isNew = true;
      }
      err = "";
      if (implantBaseDataNewData.art != null) {
        implantBaseData.art = implantBaseDataNewData.art;
      } else if (isNew) {
        err += "Keine Bezeichnung angegeben.";
      }
      if (implantBaseDataNewData.manufacturer != null) {
        implantBaseData.manufacturer = implantBaseDataNewData.manufacturer;
      } else if (isNew) {
        err += "Kein Hersteller angegeben.";
      }
      if (implantBaseDataNewData.referenceNr != null) {
        implantBaseData.referenceNr = implantBaseDataNewData.referenceNr;
      } else if (isNew) {
        err += "Keine Referenznummer angegeben.";
      }
      if (implantBaseDataNewData.model != null) {
        implantBaseData.model = implantBaseDataNewData.model;
      } else if (isNew) {
        err += "Kein Model angegeben.";
      }
      if (implantBaseDataNewData.type != null) {
        implantBaseData.type = implantBaseDataNewData.type;
      } else if (isNew) {
        err += "Kein Typ angegeben.";
      }
      implantBaseData.lastUpdated = new Date();
      if (err !== "") {
        return callback(err);
      } else {
        err = null;
      }
      if (appUser.is('superAdmin') || appUser.is('institute') || appUser.is('employee') || appUser.is('employee-auto')) {
        return saveImplantBaseData(implantBaseData, 'upsertImplantBaseData', callback);
      } else {
        return callback("Keine Berechtigung Implantatbasisdaten anzulegen");
      }
    });
  };

  exports.getImplantBaseDataFromNationalRegister = function(callback) {
    var filter;
    filter = {};
    return async.waterfall([
      function(next) {
        var selector;
        selector = {
          _id: 1,
          token: 1,
          permissionLevel: 1
        };
        return UserModel.findOne({
          permissionLevel: 'superAdmin'
        }).select(selector).lean().exec(function(err, appUser) {
          if (err != null) {
            return next(err);
          }
          if (appUser === null) {
            return next("Kein Super Admin auf dem System vorhanden");
          }
          appUser.is = function(check) {
            return check === this.permissionLevel;
          };
          return next(null, appUser);
        });
      }, function(appUser, next) {
        return updateLogService.getLastLogDate(appUser, {
          from: "national",
          to: "local",
          operation: "implantBaseData",
          success: true
        }, function(err, result) {
          var lastUpdated;
          if (err != null) {
            return next(err);
          }
          lastUpdated = (result != null) && result !== null ? result : 'none';
          return next(null, appUser, lastUpdated);
        });
      }
    ], function(err, appUser, lastUpdated) {
      var appUserToken, data;
      if (err != null) {
        return callback(err);
      }
      appUserToken = appUser.token;
      data = {};
      data.startDate = lastUpdated;
      return apiSenderService.send(environment, "getImplantBaseData", data, appUserToken, function(err, data) {
        var implantBaseData;
        if (err != null) {
          return callback(err);
        }
        implantBaseData = data.implantBaseData;
        if ((implantBaseData != null) && implantBaseData.length > 0) {
          return async.each(implantBaseData, function(implantBaseDataUnit, next) {
            delete implantBaseDataUnit._id;
            delete implantBaseDataUnit.__v;
            return ImplantBaseDataModel.update({
              referenceNr: implantBaseDataUnit.referenceNr
            }, implantBaseDataUnit, {
              upsert: true,
              "new": true
            }, function(err, savedObject) {
              if (err != null) {
                return next(err);
              }
              return next(null, savedObject._id);
            });
          }, function(err, results) {
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
        } else {
          return self.createUpdateLog(appUser, 'national', 'local', false, function(err, result) {
            if (err != null) {
              return callback(err);
            }
            return callback(null, true);
          });
        }
      });
    });
  };

  exports.getImplantBaseDataDistinct = function(appUser, filter, distinct, callback) {
    if (filter == null) {
      filter = {};
    }
    if (appUser.is('superAdmin') || appUser.is('institute') || appUser.is('employee') || appUser.is('patient')) {

    } else {
      return callback('Keine Rechte Implantatbasisdaten abzufragen');
    }
    return ImplantBaseDataModel.find(filter).distinct(distinct).exec(function(err, resultsFound) {
      if (err != null) {
        return callback(err);
      }
      if (err == null) {
        err = null;
      }
      resultsFound = resultsFound.splice(0, 30);
      return callback(err, resultsFound);
    });
  };

  removeImplantBaseData = function(implantBaseData, callback) {
    implantBaseData.deleted = true;
    return implantBaseData.save(function(err) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, true);
    });
  };

  exports.deleteImplantBaseData = function(appUser, implantBaseDataId, callback) {
    return ImplantBaseDataModel.findOne({
      _id: new ObjectId(implantBaseDataId)
    }).exec(function(err, implantBaseData) {
      if (err) {
        return callback(err);
      }
      if (err == null) {
        err = null;
      }
      if (implantBaseData == null) {
        return callback('kein Implantat mit der ID gefunden (lokal)');
      }
      if (appUser.is('superAdmin')) {

      } else {
        return callback('keine Berechtigung zum Löschen eines Implantbasisdatensatzes');
      }
      return removeImplantBaseData(implantBaseData, callback);
    });
  };

}).call(this);
