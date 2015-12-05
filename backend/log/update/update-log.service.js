(function() {
  var ObjectId, UpdateLogModel, apiSenderService, async, configDB, environment, getLogFilter, mongoose, registerType, self;

  async = require('async');

  environment = require('../../config/config.js')();

  configDB = require('../../config/database.js')(environment);

  registerType = require('../../config/register-config.js').getType();

  mongoose = require('mongoose');

  UpdateLogModel = require('./update-log.model.js');

  ObjectId = mongoose.Types.ObjectId;

  apiSenderService = require('../../api/manager/api-sender.service.js');

  self = this;

  exports.createUpdateLog = function(appUser, callback) {
    return self.createLog(appUser, 'local', 'national', 'updateLogs', true, function(err, result) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, true);
    });
  };

  exports.transferLogsToNationalRegister = function(appUser, lastUpdated, callback) {
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
    return UpdateLogModel.find(filter).lean().exec(function(err, logsFound) {
      if (err != null) {
        return callback(err);
      }
      if ((logsFound != null) && logsFound.length > 0) {
        return apiSenderService.send(environment, 'createOrUpdateUpdateLogs', logsFound, appUserToken, function(err, logIds) {
          if (err != null) {
            return callback(err);
          }
          return async.each(logIds, function(logId, next) {
            return UpdateLogModel.update({
              _id: new Object(logId._id)
            }, {
              $set: {
                refId: new Object(logId.refId),
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

  exports.createLog = function(appUser, from, to, operation, success, next) {
    var err, newUpdateLog;
    if (appUser.is('superAdmin')) {

    } else {
      return next('Keine Rechte zum erfassen von Logs');
    }
    err = "";
    newUpdateLog = new UpdateLogModel();
    if (from != null) {
      newUpdateLog.from = from;
    } else {
      err = "Nicht bekannt woher geloggt wird.";
    }
    if (to != null) {
      newUpdateLog.to = to;
    } else {
      err = "Nicht bekannt wohin transferiert wird.";
    }
    if (operation != null) {
      newUpdateLog.operation = operation;
    } else {
      err = "Nicht bekannt was geloggt wird.";
    }
    if (success != null) {
      newUpdateLog.success = success;
    } else {
      err = "Nicht bekannt ob die Operation erfolgreich war.";
    }
    newUpdateLog.customer = registerType === 'national' ? 'National' : process.env.CUSTOMER || 'unbekannt';
    if (err !== "") {
      return next(err);
    } else {
      err = null;
    }
    newUpdateLog.saveDate = new Date();
    return newUpdateLog.save(function(err) {
      if (err != null) {
        return next(err);
      }
      if (err == null) {
        err = null;
      }
      return next(err, newUpdateLog.saveDate);
    });
  };

  getLogFilter = function(appUser, filter, callback) {
    if (appUser.is('superAdmin')) {

    } else {
      return callback('Keine Berechtigung zum Lesen der Logs');
    }
    return callback(null, filter);
  };

  exports.getLogs = function(appUser, filter, page, callback) {
    var limit, skip;
    if (filter == null) {
      filter = {};
    }
    skip = page * 100;
    limit = 100;
    return getLogFilter(appUser, filter, function(err, newFilter) {
      if (err != null) {
        return callback(err);
      }
      return UpdateLogModel.find(newFilter).skip(skip).limit(limit).sort({
        saveDate: -1
      }).exec(function(err, logsFound) {
        if (err != null) {
          return callback(err);
        }
        if (err == null) {
          err = null;
        }
        return callback(err, logsFound);
      });
    });
  };

  exports.countLogs = function(appUser, filter, callback) {
    if (filter == null) {
      filter = {};
    }
    return getLogFilter(appUser, filter, function(err, newFilter) {
      if (err != null) {
        return callback(err);
      }
      return UpdateLogModel.count(newFilter).exec(function(err, countLogs) {
        if (err != null) {
          return callback(err);
        }
        if (err == null) {
          err = null;
        }
        return callback(err, countLogs);
      });
    });
  };

  exports.getLastLogDate = function(appUser, filter, callback) {
    if (filter == null) {
      filter = {};
    }
    return getLogFilter(appUser, filter, function(err, newFilter) {
      if (err != null) {
        return callback(err);
      }
      return UpdateLogModel.findOne(newFilter).sort({
        saveDate: -1
      }).exec(function(err, logsFound) {
        if (err != null) {
          return callback(err);
        }
        logsFound = logsFound !== null ? logsFound.saveDate : 'none';
        return callback(null, logsFound);
      });
    });
  };

  exports.getLogDistinct = function(appUser, filter, distinct, callback) {
    if (filter == null) {
      filter = {};
    }
    if (appUser.is('superAdmin')) {

    } else {
      return callback('Keine Rechte Logs abzufragen');
    }
    return UpdateLogModel.find(filter).distinct(distinct).exec(function(err, resultsFound) {
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

}).call(this);
