(function() {
  var ObjectId, PatientModel, apiSenderMethodsService, async, environment, eprdApiService, helperService, ordermedApiService;

  async = require('async');

  ObjectId = require('mongoose').Types.ObjectId;

  environment = require('../../config/config.js')();

  PatientModel = require('../../patient/patient.model.js');

  ordermedApiService = require('../ordermed-api/ordermed-api.service.js');

  eprdApiService = require('../eprd-api/eprd-api.service.js');

  helperService = require('../../helper/helper.service.js');

  apiSenderMethodsService = require('./api-sender-methods.service.js');

  exports.send = function(environment, method, data, token, callback) {
    var dataPiece, i, last, len, newData;
    if (data.implant != null) {
      data.implant = apiSenderMethodsService.bsonToJson(data.implant);
    } else if (data._id != null) {
      data = apiSenderMethodsService.bsonToJson(data);
    } else if (helperService.determineType(data) === 'array') {
      newData = [];
      for (i = 0, len = data.length; i < len; i++) {
        dataPiece = data[i];
        dataPiece = apiSenderMethodsService.bsonToJson(dataPiece);
        newData.push(dataPiece);
      }
      data = newData;
    }
    last = false;
    if (method.indexOf('Last') !== -1) {
      method = method.replace('Last', '');
      last = true;
    }
    switch (method) {
      case 'getInitial':
        return apiSenderMethodsService.getBaseUrl(data.institute, function(err, url) {
          if (err != null) {
            return callback(err);
          }
          url = url + '/getInitial/' + data.initialKey;
          return apiSenderMethodsService.emitGet(url, token, callback);
        });
      case 'createOrUpdateInstitutes':
        return apiSenderMethodsService.getNationalUrl(function(err, url) {
          if (err != null) {
            return callback(err);
          }
          url = url + '/createOrUpdateInstitutes';
          return apiSenderMethodsService.emitPost(url, data, token, callback);
        });
      case 'createOrUpdateUsers':
        return apiSenderMethodsService.getNationalUrl(function(err, url) {
          if (err != null) {
            return callback(err);
          }
          url = url + '/createOrUpdateUsers';
          return apiSenderMethodsService.emitPost(url, data, token, callback);
        });
      case 'activateUser':
        return apiSenderMethodsService.getBaseUrl(data.institute, function(err, url) {
          if (err != null) {
            return callback(err);
          }
          url = url + '/updateUser';
          return async.series({
            apis: function(next) {
              return apiSenderMethodsService.emitPut(url, data, token, next);
            },
            vitabook: function(next) {
              if (['institute', 'employee', 'patient'].some(function(permission) {
                return permission === data.permissionLevel;
              })) {
                return ordermedApiService.ordermedWSSaveDoctor(data, next);
              } else {
                return next(null, null);
              }
            }
          }, function(err, results) {
            if (err != null) {
              return callback(err);
            }
            return callback(null, results.apis);
          });
        });
      case 'createOrUpdatePatients':
        return apiSenderMethodsService.getNationalUrl(function(err, url) {
          if (err != null) {
            return callback(err);
          }
          url = url + '/createOrUpdatePatients';
          return apiSenderMethodsService.emitPost(url, data, token, callback);
        });
      case 'createOrUpdateImplants':
        return apiSenderMethodsService.getNationalUrl(function(err, url) {
          if (err != null) {
            return callback(err);
          }
          url = url + '/createOrUpdateImplants';
          return apiSenderMethodsService.emitPost(url, data, token, callback);
        });
      case 'createOrUpdateEprds':
        return apiSenderMethodsService.getNationalUrl(function(err, url) {
          if (err != null) {
            return callback(err);
          }
          url = url + '/createOrUpdateEprds';
          return apiSenderMethodsService.emitPost(url, data, token, callback);
        });
      case 'createOrUpdateImplantBaseData':
        return apiSenderMethodsService.getNationalUrl(function(err, url) {
          if (err != null) {
            return callback(err);
          }
          url = url + '/createOrUpdateImplantBaseData';
          return apiSenderMethodsService.emitPost(url, data, token, callback);
        });
      case 'getImplantBaseData':
        return apiSenderMethodsService.getBaseUrl(data.institute, function(err, url) {
          if (err != null) {
            return callback(err);
          }
          url = url + '/getImplantBaseData/' + data.startDate.toString();
          return apiSenderMethodsService.emitGet(url, token, callback);
        });
      case 'createOrUpdateUpdateLogs':
        return apiSenderMethodsService.getNationalUrl(function(err, url) {
          if (err != null) {
            return callback(err);
          }
          url = url + '/createOrUpdateUpdateLogs';
          return apiSenderMethodsService.emitPost(url, data, token, callback);
        });
      case 'createOrUpdateChangeLogs':
        return apiSenderMethodsService.getNationalUrl(function(err, url) {
          if (err != null) {
            return callback(err);
          }
          url = url + '/createOrUpdateChangeLogs';
          return apiSenderMethodsService.emitPost(url, data, token, callback);
        });
      default:
        return callback(method + " is no valid method");
    }
  };

}).call(this);
