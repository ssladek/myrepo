(function() {
  var PatientModel, async, changeLogService, implantService, inspect, odermedMappingService, odermedWebServiceConfig, ordermedWSSaveDoctor, ordermedWSSavePatient, ordermedWSSaveTreatments, ordermedWSgetInstituteDetails, ordermedWSgetInstitutesAndUsers, ordermedWSgetToken, patientService, registerName, request, requestPOST, self, userService;

  async = require('async');

  request = require('request');

  inspect = require('eyespect').inspector({
    maxLength: null
  });

  odermedWebServiceConfig = require('../../config/ordermed-webservice-config.js');

  PatientModel = require('../../patient/patient.model.js');

  odermedMappingService = require('./ordermed-mapping.service.js');

  userService = require('../../user/user.service.js');

  implantService = require('../../implant/implant.service.js');

  changeLogService = require('../../log/change/change-log.service.js');

  patientService = require('../../patient/patient.service.js');

  self = this;

  registerName = 'nationale';

  exports.createUpdateLog = function(appUser, from, to, whatUpdated, status, callback) {
    return changeLogService.createLog(appUser, null, from, to, whatUpdated, status, function(err, result) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, true);
    });
  };

  requestPOST = function(url, data, callback) {
    return request.post(url).json(data).on('response', function(res) {
      if (res.statusCode === 200) {
        data = "";
        res.on('data', function(chunk) {
          return data += chunk;
        });
        return res.on('end', function() {
          var err;
          try {
            data = JSON.parse(data.toString());
            if (data.err != null) {
              return callback(data.err);
            }
            return callback(null, data);
          } catch (_error) {
            err = _error;
            console.log("response error (api local/national), " + err);
            return callback("Fehler bei der Übertragung in das " + registerName + " Register Antwortdaten ungültig");
          }
        });
      } else {
        console.log("\n\nres POST vitabook test\n", "statusCode", res.statusCode, "\nstatusMessage", res.statusMessage, "\nstatusBody", JSON.stringify(res.request.body), "\n\n");
        return callback("Fehler bei der Übertragung in das " + registerName + " Register keine Verbindung (A)");
      }
    }).on('error', function(err) {
      console.log("err POST vitabook test", err);
      return callback("Fehler bei der Übertragung in das " + registerName + " Register keine Verbindung (B)");
    });
  };

  exports.sendTestToVitabook = function(appUser, method, callback) {
    console.log("#-------------------------- TEST VITABOOK API --------------------------#");
    return ordermedWSgetToken(function(err, token) {
      var filter, populate;
      if (err != null) {
        return callback(err);
      }
      switch (method) {
        case 'ordermedWSgetInstitutesAndUsers':
          return self.ordermedWSgetInstitutesAndUsers(appUser, function(err, success) {});
        case 'ordermedWSSaveUsers':
          filter = {};
          filter.active = true;
          filter.deleted = false;
          return userService.getUsers(appUser, filter, {}, 1, function(err, usersFound) {
            if (err != null) {
              return callback(err);
            }
            if ((usersFound != null) && usersFound.length === 1) {
              return ordermedWSSaveDoctor(token, usersFound[0], function(err, response) {
                if (err != null) {
                  return callback(err);
                }
                return console.log("response SaveDoctor", response);
              });
            } else {
              return callback("Keine User gefunden");
            }
          });
        case 'ordermedWSSavePatients':
          filter = {};
          filter.sendToVitabook = {
            $ne: false
          };
          filter.deleted = false;
          populate = {
            "institute": {
              eprdClientNr: 0,
              eprdClientLizenz: 0,
              initialKey: 0
            },
            "creator": {
              password: 0,
              vitabookPassword: 0,
              token: 0
            }
          };
          return patientService.getPatients(appUser, filter, {}, populate, 1, function(err, patientsFound) {
            var i, index, ref;
            if (err != null) {
              return callback(err);
            }
            for (index = i = ref = patientsFound - 1; i >= 0; index = i += -1) {
              if ((patientsFound.institute != null) && patientsFound.institute.sendToVitabook === false && patientsFound.sendToVitabook !== true) {
                patientsFound.splice(index, 1);
              }
            }
            if ((patientsFound != null) && patientsFound.length === 1) {
              return ordermedWSSavePatient(token, patientsFound[0], function(err, response) {
                if (err != null) {
                  return callback(err);
                }
                return console.log("response SavePatient", response);
              });
            } else {
              return callback("Keine Patienten gefunden");
            }
          });
        case 'ordermedWSSaveImplants':
          console.log("\n------------ordermedWSSaveImplants------------\n");
          filter = {};
          filter.deleted = false;
          return implantService.buildTreatments(filter, 'vitabook', function(err, treatments) {
            if (err != null) {
              return callback(err);
            }
            return ordermedWSSaveTreatments(token, treatments, callback);
          });
      }
    });
  };

  exports.ordermedWSgetInstitutesAndUsers = function(appUser, callback) {
    return ordermedWSgetToken(function(err, token) {
      if (err != null) {
        return callback(err);
      }
      if (token == null) {
        return callback('kein Token');
      }
      return ordermedWSgetInstitutesAndUsers(appUser, token, function(err, response) {
        if (err != null) {
          return callback(err);
        }
        console.log("succesful ordermedWSgetInstitutesAndUsers", response);
        return self.createUpdateLog(appUser, 'vitabook', 'national', 'institutesAndUsers', 'succesful', function(err, response) {
          if (err != null) {
            return callback(err);
          }
          return callback(null, true);
        });
      });
    });
  };

  ordermedWSgetToken = function(callback) {
    var data, url;
    url = 'http://dev.order-med.de/WebServices/Client/Implantat-Manager.asmx/RequestAuthToken?form=json';
    data = {
      _UserName: "im2015",
      _Password: "0x18e247cb45d02b27bcd89c96101e48bdac33fb2e",
      _ClientID: null
    };
    return requestPOST(url, data, function(err, token) {
      if (err != null) {
        return callback(err);
      }
      if (token == null) {
        return callback("kein Token");
      }
      return callback(null, token);
    });
  };

  ordermedWSgetInstitutesAndUsers = function(appUser, token, callback) {
    var data, date, url;
    url = 'http://dev.order-med.de/WebServices/Client/Implantat-Manager.asmx/GetClinicByContractSignatureForStart?form=json';
    date = new Date().toISOString().slice(0, 10);
    date = '2015-09-17';
    data = {
      "_Token": token,
      "_StartDate": date
    };
    return requestPOST(url, data, function(err, institutes) {
      if (err != null) {
        return callback(err);
      }
      if (institutes != null) {
        async.each(institutes, function(institute, next) {
          return ordermedWSgetInstituteDetails(token, institute.ID, function(err, instituteAndUsers) {
            if (err != null) {
              return next(err);
            }
            if (instituteAndUsers == null) {
              return next("keine Details vorhanden");
            }
            return odermedMappingService.saveInstituteAndUsers(appUser, instituteAndUsers, function(err, success) {
              console.log(err, success);
              if (err != null) {
                return next(err);
              }
              return next(null, true);
            });
          });
        }, function(err) {
          if (err != null) {
            return callback(err);
          }
          return callback(null, true);
        });
      } else {
        require('../../helper/helper.service.js').powerLog(response);
        return callback('Kliniken (CompanyItemWS) nicht vorhanden');
      }
      if (typeof institute === "undefined" || institute === null) {
        return callback("keine Klinik");
      }
      return callback(null, institute);
    });
  };

  ordermedWSgetInstituteDetails = function(token, instituteId, callback) {
    var data, url;
    url = 'http://dev.order-med.de/WebServices/Client/Implantat-Manager.asmx/GetCompanyByID';
    data = {
      "_Token": token,
      "_CompanyID": instituteId
    };
    return requestPOST(url, data, function(err, instituteDetails) {
      var response;
      if (err != null) {
        return callback(err);
      }
      response = odermedMappingService.mapOrdermedInstituteAndPerson(instituteDetails);
      return callback(null, response);
    });
  };

  ordermedWSSaveDoctor = function(token, user, callback) {
    var url;
    url = 'http://dev.order-med.de/WebServices/Client/Implantat-Manager.asmx/SaveDoctor';
    return odermedMappingService.mapUserToOrdermedDoctor(user, function(err, doctorToSave) {
      var data;
      if (err != null) {
        return callback(err);
      }
      console.log("_DoctorToSave", JSON.stringify(doctorToSave));
      console.log("_Token", token);
      data = {
        "_Token": token,
        "_DoctorToSave": doctorToSave,
        "_CreateSystemAccount": true
      };
      return requestPOST(url, data, function(err, response) {
        if (err != null) {
          return callback(err);
        }
        if (response.ID == null) {
          return callback("Keine vitabookID erhalten");
        }
        console.log("response", response);
        user.vitabookId = response.ID;
        return user.save(function(err) {
          if (err != null) {
            return callback(err);
          }
          return callback(null, response);
        });
      });
    });
  };

  ordermedWSSavePatient = function(token, patient, callback) {
    var url;
    url = 'http://dev.order-med.de/WebServices/Client/Implantat-Manager.asmx/SavePatient';
    return odermedMappingService.mapPatientToOrdermedPatient(patient, function(err, patientToSave) {
      var data;
      if (err != null) {
        return callback(err);
      }
      console.log("patient", JSON.stringify(patientToSave));
      data = {
        "_Token": token,
        "_PatientToSave": patientToSave,
        "_CreateSystemAccount": true
      };
      return requestPOST(url, data, function(err, response) {
        if (err != null) {
          return callback(err);
        }
        if (response.ID == null) {
          return callback("Keine vitabookID erhalten");
        }
        console.log("response", response);
        patient.vitabookId = response.ID;
        patient.save(function(err) {
          if (err != null) {
            return callback(err);
          }
          return callback(null, response);
        });
        return callback(null, response);
      });
    });
  };

  ordermedWSSaveTreatments = function(token, treatments, callback) {
    var ordermedTreatments, url;
    url = 'http://dev.order-med.de/WebServices/Client/Implantat-Manager.asmx/SaveTreatmentsForPatient';
    ordermedTreatments = [];
    return async.each(treatments, function(treatment, next) {
      return odermedMappingService.mapTreatmentToOrdermedTreatment(treatment, function(err, ordermedTreatment) {
        if (err != null) {
          return next(err);
        }
        return ordermedTreatments.push(ordermedTreatment);
      });
    }, function(err) {
      var data;
      if (err != null) {
        return callback(err);
      }
      data = {
        "_Token": token,
        "_Treatments": ordermedTreatments
      };
      return requestPOST(url, data, function(err, response) {
        if (err != null) {
          return callback(err);
        }
        if (response.ID == null) {
          return callback("Keine vitabookID erhalten");
        }
        console.log("response", response);
        return callback(null, response);
      });
    });
  };

}).call(this);
