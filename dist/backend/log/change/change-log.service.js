(function() {
  var ChangeLogModel, ObjectId, apiSenderService, async, configDB, environment, getLogFilter, mongoose, registerType, self, updateLogService;

  async = require('async');

  environment = require('../../config/config.js')();

  configDB = require('../../config/database.js')(environment);

  registerType = require('../../config/register-config.js').getType();

  mongoose = require('mongoose');

  ChangeLogModel = require('./change-log.model.js');

  ObjectId = mongoose.Types.ObjectId;

  updateLogService = require('../update/update-log.service.js');

  apiSenderService = require('../../api/manager/api-sender.service.js');

  self = this;

  exports.createUpdateLog = function(appUser, callback) {
    return updateLogService.createLog(appUser, 'local', 'national', 'changeLogs', true, function(err, result) {
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
    return ChangeLogModel.find(filter).lean().exec(function(err, logsFound) {
      if (err != null) {
        return callback(err);
      }
      if ((logsFound != null) && logsFound.length > 0) {
        return apiSenderService.send(environment, 'createOrUpdateLogs', logsFound, appUserToken, function(err, logIds) {
          if (err != null) {
            return callback(err);
          }
          return async.each(logIds, function(logId, next) {
            return ChangeLogModel.update({
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

  exports.createLog = function(appUser, changedId, model, attribute, oldValue, newValue, next) {
    var err, newLog;
    if (appUser.is('superAdmin') || appUser.is('institute') || appUser.is('employee') || appUser.is('employee-auto') || appUser.is('patient')) {

    } else {
      return next('Keine Rechte zum erfassen von Logs');
    }
    if ((oldValue != null) && (newValue != null) && (oldValue.toString() === newValue.toString())) {
      return next(null, oldValue);
    }
    err = "";
    newLog = new ChangeLogModel();
    if (model != null) {
      newLog.model = model;
    } else {
      err = "Keine Log Model vorhanden.";
    }
    if (appUser._id != null) {
      newLog.userId = new ObjectId(appUser._id);
    } else {
      err = "User kann nicht zugeordnet werden.";
    }
    if (attribute != null) {
      newLog.attribute = attribute;
    } else {
      err = "Kein Log Attribut vorhanden.";
    }
    if (changedId != null) {
      newLog.changedId = new ObjectId(changedId);
    } else {
      err = "Log Item kann nicht zugeordnet werden.";
    }
    if (oldValue != null) {
      newLog.oldValue = oldValue.toString();
    } else {
      newLog.oldValue = "kein vorheriger Wert";
    }
    if (newValue != null) {
      newLog.newValue = newValue.toString();
    } else {
      err += "Kein neuer Wert angegeben.";
    }
    newLog.customer = registerType === 'national' ? 'National' : process.env.CUSTOMER || 'unbekannt';
    if (err !== "") {
      return next(err);
    } else {
      err = null;
    }
    newLog.changeDate = new Date();
    return newLog.save(function(err) {
      if (err != null) {
        return next(err);
      }
      if (err == null) {
        err = null;
      }
      return next(err, newValue);
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
      return ChangeLogModel.find(newFilter).skip(skip).limit(limit).sort({
        changeDate: -1
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
      return ChangeLogModel.count(newFilter).exec(function(err, countLogs) {
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
      return ChangeLogModel.findOne(newFilter).sort({
        changeDate: -1
      }).exec(function(err, logsFound) {
        if (err != null) {
          return callback(err);
        }
        logsFound = logsFound !== null ? logsFound.changeDate : 'none';
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
    return ChangeLogModel.find(filter).distinct(distinct).exec(function(err, resultsFound) {
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
