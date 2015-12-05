(function() {
  var CronJob, ImplantBaseDataModel, ImplantModel, PatientModel, UserModel, async, changeLogService, eprdService, getAppUserAndLastUpdate, implantBaseDataService, implantService, instituteService, launchCronEprd, launchCronImplantBaseData, launchCronNational, launchCronVitabook, logger, ordermedApiService, patientService, runCronEprd, runCronImplantBaseData, runCronNational, runCronVitabook, scheduleEprd, scheduleImplantBaseData, scheduleNational, scheduleVitabook, updateLogService, userService;

  CronJob = require('cron').CronJob;

  async = require('async');

  UserModel = require('../user/user.model.js');

  PatientModel = require('../patient/patient.model.js');

  ImplantModel = require('../implant/implant.model.js');

  ImplantBaseDataModel = require('../implant-base-data/implant-base-data.model.js');

  changeLogService = require('../log/change/change-log.service.js');

  updateLogService = require('../log/update/update-log.service.js');

  instituteService = require('../institute/institute.service.js');

  userService = require('../user/user.service.js');

  patientService = require('../patient/patient.service.js');

  implantService = require('../implant/implant.service.js');

  implantBaseDataService = require('../implant-base-data/implant-base-data.service.js');

  eprdService = require('../eprd/eprd.service.js');

  logger = require('../logger/logger.js');

  ordermedApiService = require('../api/ordermed-api/ordermed-api.service.js');

  implantBaseDataService = require('../implant-base-data/implant-base-data.service.js');

  exports.launchCrons = function(environment) {
    return null;
  };

  getAppUserAndLastUpdate = function(filter, callback) {
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
        return updateLogService.getLastLogDate(appUser, filter, function(err, result) {
          var lastUpdated;
          if (err != null) {
            return next(err);
          }
          lastUpdated = (result != null) && result !== null ? result : 'none';
          return next(null, appUser, lastUpdated);
        });
      }
    ], function(err, appUser, lastUpdated) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, appUser, lastUpdated);
    });
  };

  launchCronVitabook = function(environment) {
    if (require('./register-config.js').getType() === 'national') {
      if (environment === 'test') {
        return false;
      } else if (environment === 'development') {
        return false;
      } else if (environment === 'production') {
        return runCronVitabook(environment);
      }
    } else {
      return false;
    }
  };

  scheduleVitabook = function(environment) {
    if (environment === 'test') {
      return '*/2 * * * *';
    } else if (environment === 'development') {
      return '*/2 * * * *';
    } else if (environment === 'production') {
      return '00 30 23 * * *';
    }
  };

  runCronVitabook = function(environment) {
    var job;
    console.log("cron active: vitabook");
    return job = new CronJob(scheduleVitabook(environment), function() {
      return ordermedApiService.ordermedWSgetInstitutesAndUsers(function(err, success) {
        if (err != null) {
          console.log("err cron vitabook", err);
        }
        if ((success != null) && (err == null)) {
          return console.log("success cron vitabook");
        }
      });
    }, function() {}, true, 'Europe/Amsterdam');
  };

  launchCronEprd = function(environment) {
    if (require('./register-config.js').getType() === 'national') {
      logger.info("Started CronEprd, schedule: " + (scheduleEprd(environment)));
      if (environment === 'test') {
        return false;
      } else if (environment === 'development') {
        return runCronEprd(environment);
      } else if (environment === 'production') {
        return runCronEprd(environment);
      }
    } else {
      logger.info("Not starting CronEprd");
      return false;
    }
  };

  scheduleEprd = function(environment) {
    if (environment === 'test') {
      return '*/2 * * * *';
    } else if (environment === 'development') {
      return '*/30 * * * * *';
    } else if (environment === 'production') {
      return '00 45 00 * * *';
    }
  };

  runCronEprd = function(environment) {
    var job;
    return job = new CronJob(scheduleEprd(environment), function() {
      var filter;
      console.log("\n############################### EPRD CRON #############################\n");
      filter = {
        from: "national",
        to: "eprd",
        operation: "eprds",
        success: true
      };
      return getAppUserAndLastUpdate(filter, function(err, appUser, lastUpdated) {
        var timeoutProtect;
        if (err == null) {
          timeoutProtect = setTimeout((function() {
            timeoutProtect = null;
            return console.log('eprd timed out');
          }), 25000);
          return eprdService.transferEprdsToRegister(appUser, lastUpdated, 'eprd', function(err, success) {
            if (timeoutProtect) {
              clearTimeout(timeoutProtect);
              if (err != null) {
                console.log("err cron eprd", err);
              }
              if (err == null) {
                return console.log("Status to EPRD:", success);
              }
            }
          });
        } else {
          if (err != null) {
            return console.log("err cron eprd", err);
          }
        }
      });
    }, function() {
      return console.log('updloaded to eprd register');
    }, true, 'Europe/Amsterdam');
  };

  launchCronImplantBaseData = function(environment) {
    if (require('./register-config.js').getType() === 'local') {
      logger.info("Started CronImplantBaseData, schedule: " + (scheduleImplantBaseData(environment)));
      if (environment === 'test') {
        return false;
      } else if (environment === 'development') {
        return runCronImplantBaseData(environment);
      } else if (environment === 'production') {
        return runCronImplantBaseData(environment);
      }
    } else {
      logger.info("Not starting CronImplantBaseData");
      return false;
    }
  };

  scheduleImplantBaseData = function(environment) {
    if (environment === 'test') {
      return '*/2 * * * *';
    } else if (environment === 'development') {
      return '*/30 * * * * *';
    } else if (environment === 'production') {
      return '0 0 */1 * * *';
    }
  };

  runCronImplantBaseData = function(environment) {
    var job;
    return job = new CronJob(scheduleImplantBaseData(environment), function() {
      return implantBaseDataService.getImplantBaseDataFromNationalRegister(function(err, success) {
        if (err != null) {
          console.log("err cron base data", err);
        }
        if (success != null) {
          return console.log("Status Reciving ImplantBaseData from National", success);
        }
      });
    }, function() {}, true, 'Europe/Amsterdam');
  };

  launchCronNational = function(environment) {
    if (require('./register-config.js').getType() === 'local') {
      logger.info("Started CronNational, schedule: " + (scheduleImplantBaseData(environment)));
      if (environment === 'test') {
        return false;
      } else if (environment === 'development') {
        return runCronNational(environment);
      } else if (environment === 'production') {
        return runCronNational(environment);
      }
    } else {
      logger.info("Not starting CronImplantBaseData");
      return false;
    }
  };

  scheduleNational = function(environment) {
    if (environment === 'test') {
      return '*/2 * * * *';
    } else if (environment === 'development') {
      return '*/30 * * * * *';
    } else if (environment === 'production') {
      return '00 30 00 * * *';
    }
  };

  runCronNational = function(environment) {
    var job;
    return job = new CronJob(scheduleNational(environment), function() {
      console.log("\n############################### NATIONAL CRON #############################\n");
      return async.series({
        institutes: function(next) {
          var filter;
          filter = {
            from: "local",
            to: "national",
            operation: "institutes",
            success: true
          };
          return getAppUserAndLastUpdate(filter, function(err, appUser, lastUpdated) {
            if (err != null) {
              return next(err);
            }
            return instituteService.transferInstitutesToNationalRegister(appUser, lastUpdated, function(err, success) {
              if (err != null) {
                return next(err);
              }
              return next(null, success);
            });
          });
        },
        users: function(next) {
          var filter;
          filter = {
            from: "local",
            to: "national",
            operation: "users",
            success: true
          };
          return getAppUserAndLastUpdate(filter, function(err, appUser, lastUpdated) {
            if (err != null) {
              return next(err);
            }
            return userService.transferUsersToNationalRegister(appUser, lastUpdated, function(err, success) {
              if (err != null) {
                return next(err);
              }
              return next(null, success);
            });
          });
        },
        patients: function(next) {
          var filter;
          filter = {
            from: "local",
            to: "national",
            operation: "patients",
            success: true
          };
          return getAppUserAndLastUpdate(filter, function(err, appUser, lastUpdated) {
            if (err != null) {
              return next(err);
            }
            return patientService.transferPatientsToNationalRegister(appUser, lastUpdated, function(err, success) {
              if (err != null) {
                return next(err);
              }
              return next(null, success);
            });
          });
        },
        implants: function(next) {
          var filter;
          filter = {
            from: "local",
            to: "national",
            operation: "implants",
            success: true
          };
          return getAppUserAndLastUpdate(filter, function(err, appUser, lastUpdated) {
            if (err != null) {
              return next(err);
            }
            return implantService.transferImplantsToNationalRegister(appUser, lastUpdated, function(err, success) {
              if (err != null) {
                return next(err);
              }
              return next(null, success);
            });
          });
        },
        eprds: function(next) {
          var filter;
          filter = {
            from: "local",
            to: "national",
            operation: "eprds",
            success: true
          };
          return getAppUserAndLastUpdate(filter, function(err, appUser, lastUpdated) {
            if (err != null) {
              return next(err);
            }
            return eprdService.transferEprdsToRegister(appUser, lastUpdated, 'manager', function(err, success) {
              if (err != null) {
                return next(err);
              }
              return next(null, success);
            });
          });
        },
        implantBaseData: function(next) {
          var filter;
          filter = {
            from: "local",
            to: "national",
            operation: "implantBaseData",
            success: true
          };
          return getAppUserAndLastUpdate(filter, function(err, appUser, lastUpdated) {
            if (err != null) {
              return next(err);
            }
            return implantBaseDataService.transferImplantBaseDataToNationalRegister(appUser, lastUpdated, function(err, success) {
              if (err != null) {
                return next(err);
              }
              return next(null, success);
            });
          });
        },
        changeLogs: function(next) {
          var filter;
          filter = {
            from: "local",
            to: "national",
            operation: "changeLogs",
            success: true
          };
          return getAppUserAndLastUpdate(filter, function(err, appUser, lastUpdated) {
            if (err != null) {
              return next(err);
            }
            return changeLogService.transferLogsToNationalRegister(appUser, lastUpdated, function(err, success) {
              if (err != null) {
                return next(err);
              }
              return next(null, success);
            });
          });
        },
        updateLogs: function(next) {
          var filter;
          filter = {
            from: "local",
            to: "national",
            operation: "updateLogs",
            success: true
          };
          return getAppUserAndLastUpdate(filter, function(err, appUser, lastUpdated) {
            if (err != null) {
              return next(err);
            }
            return updateLogService.transferLogsToNationalRegister(appUser, lastUpdated, function(err, success) {
              if (err != null) {
                return next(err);
              }
              return next(null, success);
            });
          });
        }
      }, function(err, results) {
        if (err != null) {
          console.log("err cron manager", err);
        }
        if (err == null) {
          return console.log("Status Updating to National: ", results);
        }
      });
    }, function() {
      return console.log('updloaded to national register');
    }, true, 'Europe/Amsterdam');
  };

}).call(this);
