(function() {
  var EprdModel, ImplantModel, InstituteModel, ObjectId, PatientModel, async, eprdWSImplantPlus, eprdWSgetToken, formatDate, getAge, js2xmlparser, logger, mapParamsToEPRDBase, mapParamsToEPRDImplantPlus, mapParamsToEPRDToken, packParams, soap;

  soap = require('soap');

  async = require('async');

  js2xmlparser = require("js2xmlparser");

  logger = require('../../logger/logger.js');

  ImplantModel = require('../../implant/implant.model.js');

  InstituteModel = require('../../institute/institute.model.js');

  PatientModel = require('../../patient/patient.model.js');

  EprdModel = require('../../eprd/eprd.model.js');

  ObjectId = require('mongoose').Types.ObjectId;

  mapParamsToEPRDBase = function(Params, institute) {
    var WSParam;
    WSParam = {};
    WSParam['q1:ByteStream'] = null;
    WSParam['q1:Name'] = "IKNRKH";
    WSParam['q1:Type'] = "Text";
    WSParam['q1:Value'] = institute.instituteNr;
    Params.push(WSParam);
    WSParam = {};
    WSParam['q1:ByteStream'] = null;
    WSParam['q1:Name'] = "STANDORT";
    WSParam['q1:Type'] = "Text";
    WSParam['q1:Value'] = institute.locationNr;
    Params.push(WSParam);
    WSParam = {};
    WSParam['q1:ByteStream'] = null;
    WSParam['q1:Name'] = "BSNR";
    WSParam['q1:Type'] = "Integer";
    WSParam['q1:Value'] = institute.unitNr.toString();
    Params.push(WSParam);
    return Params;
  };

  mapParamsToEPRDToken = function(Params, patient, callback) {
    var WSParam, birthdate;
    WSParam = {};
    WSParam['q1:ByteStream'] = null;
    WSParam['q1:Name'] = "KHFALLNR";
    WSParam['q1:Type'] = "Text";
    WSParam['q1:Value'] = patient.patientId;
    Params.push(WSParam);
    WSParam = {};
    WSParam['q1:ByteStream'] = null;
    WSParam['q1:Name'] = "VERS_NR";
    WSParam['q1:Type'] = "Text";
    WSParam['q1:Value'] = patient.insurant;
    Params.push(WSParam);
    birthdate = formatDate(patient.birthdate);
    WSParam = {};
    WSParam['q1:ByteStream'] = null;
    WSParam['q1:Name'] = "VERS_GEBDATUM";
    WSParam['q1:Type'] = "Date";
    WSParam['q1:Value'] = birthdate;
    Params.push(WSParam);
    WSParam = {};
    WSParam['q1:ByteStream'] = null;
    WSParam['q1:Name'] = "ANFRAGETYP";
    WSParam['q1:Type'] = "Integer";
    WSParam['q1:Value'] = "0";
    Params.push(WSParam);
    return Params;
  };

  formatDate = function(date) {
    date = date.toISOString().slice(0, 10).split("-");
    return date = date[2] + '.' + date[1] + '.' + date[0];
  };

  getAge = function(birthdate, processingDate) {
    var diffDays, firstDate, oneDay, secondDate;
    oneDay = 24 * 60 * 60 * 1000;
    firstDate = new Date(birthdate);
    secondDate = new Date(processingDate);
    return diffDays = Math.round(Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / oneDay)) / 365).toString();
  };

  mapParamsToEPRDImplantPlus = function(Params, transferNr, institute, patient, implants, callback) {
    var age, fall, index;
    fall = {};
    fall['@'] = {};
    fall['@'].aufndatum = formatDate(patient.saveDate);
    fall['@'].kkpat = patient.insurance;
    age = getAge(patient.birthdate, 'Wed Oct 21 2015 14:57:24 GMT+0200 (CEST)');
    fall['@'].alteraufn = age;
    if (patient.gender === 'Herr') {
      fall['@'].geschlecht = "1";
    } else {
      fall['@'].geschlecht = "2";
    }
    fall['@'].ewreg = "1";
    fall['@'].ewfrueh = "1";
    fall['@'].ewspei = "1";
    fall['@'].transfernr = transferNr;
    fall['info'] = "";
    fall['operation'] = [];
    index = 1;
    return async.each(implants, function(implant, next) {
      return EprdModel.findOne({
        'implant': implant.refId,
        'institute': institute._id
      }).lean().exec(function(err, eprd) {
        if (err != null) {
          return next(err);
        }
        if (eprd === null) {
          return next("EPRD Datensatz nicht gefunden");
        }
        implant.eprd = eprd;
        return next(null, null);
      });
    }, function(err) {
      var WSParam, d, eprdImplantatplusdatensatz, i, implant, len, newOperation, op_artikel, sendingDate, xml;
      if (err != null) {
        return callback(err);
      }
      newOperation = {};
      newOperation['@'] = {};
      newOperation['@'].opnummer = "1";
      newOperation['@'].opdatum = formatDate(implants[0].saveDate);
      newOperation['@'].gelenk = implants[0].eprd.gelenk;
      newOperation['@'].seite = implants[0].eprd.seite;
      newOperation['@'].arteingriff = implants[0].eprd.arteingriff;
      if (implants[0].eprd.arteingriff === '1') {
        newOperation['@'].vorop = implants[0].eprd.vorop;
        newOperation['@'].wechselgrund = "";
      } else if (implants[0].eprd.arteingriff === '3') {
        newOperation['@'].vorop = "";
        newOperation['@'].wechselgrund = implants[0].eprd.wechselgrund;
      }
      newOperation['@'].zweizeitwechsel = implants[0].eprd.zweizeitwechsel;
      newOperation['@'].freitext = implants[0].comment;
      newOperation['op_artikel'] = [];
      for (i = 0, len = implants.length; i < len; i++) {
        implant = implants[i];
        op_artikel = {};
        op_artikel['@'] = {};
        op_artikel['@'].lfdnr = index.toString();
        index++;
        op_artikel['@'].artikelnr = implant.referenceNr;
        op_artikel['@'].artikeltyp = implant.eprd.artikeltyp;
        op_artikel['@'].hersteller = implant.eprd.hersteller;
        op_artikel['@'].bezeichnung = implant.art;
        op_artikel['@'].charge = implant.lot;
        op_artikel['@'].menge = "1";
        op_artikel['@'].einheit = implant.eprd.einheit;
        newOperation['op_artikel'].push(op_artikel);
      }
      fall['operation'].push(newOperation);
      eprdImplantatplusdatensatz = {};
      eprdImplantatplusdatensatz['@'] = {};
      eprdImplantatplusdatensatz['@'].version = "1n0sr1";
      d = new Date();
      sendingDate = ('0' + d.getDate()).slice(-2) + '.' + ('0' + d.getMonth()).slice(-2) + '.' + d.getFullYear() + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2);
      eprdImplantatplusdatensatz['@'].erstelltam = sendingDate;
      eprdImplantatplusdatensatz.fall = fall;
      xml = js2xmlparser("eprd_implantatplusdatensatz", eprdImplantatplusdatensatz);
      WSParam = {};
      WSParam['q1:ByteStream'] = null;
      WSParam['q1:Name'] = "FALLDATEN";
      WSParam['q1:Type'] = "Xml";
      WSParam['q1:Value'] = xml;
      Params.push(WSParam);
      return callback(null, Params);
    });
  };

  packParams = function(Params) {
    Params = {
      'q1:WSParam': Params
    };
    return Params;
  };

  exports.eprdWSsaveImplant = function(patient, implant, callback) {
    if ((patient != null) && patient.sendToEprd === true) {
      return async.parallel({
        institute: function(next) {
          return InstituteModel.findOne({
            _id: new ObjectId(implant.institute)
          }).lean().exec(function(err, instituteFound) {
            if (err != null) {
              return next(err);
            }
            if (instituteFound === null) {
              return next("Klinik nicht gefunden");
            }
            if (instituteFound.eprdClientNr == null) {
              return next("Klinik besitzt keine EPRD Mandatennummer");
            }
            return next(null, instituteFound);
          });
        },
        implants: function(next) {
          return ImplantModel.find({
            operationId: implant.operationId
          }).lean().exec(function(err, implantsFound) {
            if (err != null) {
              return next(err);
            }
            if (implantsFound === null) {
              return next("Keine Implantate gefunden");
            }
            return next(null, implantsFound);
          });
        }
      }, function(err, results) {
        if (err != null) {
          return callback(err);
        }
        if ((results.implants != null) && results.implants.length > 0) {
          return eprdWSgetToken(results.institute, patient, function(err, transferNr) {
            if (err != null) {
              return callback(err);
            }
            return eprdWSImplantPlus(transferNr, results.institute, patient, results.implants, function(err) {
              var filter, i, len, ref, refList;
              if (err != null) {
                return callback(err);
              }
              refList = [];
              ref = results.implants;
              for (i = 0, len = ref.length; i < len; i++) {
                implant = ref[i];
                refList.push(implant.refId);
              }
              filter = {};
              filter['implant'] = {};
              filter['implant']['$in'] = refList;
              filter['institute'] = results.implants[0].institute;
              return EprdModel.update(filter, {
                $set: {
                  lastSyncedEprd: new Date()
                }
              }, function(err) {
                if (err != null) {
                  return callback(err);
                }
                return callback(null, true);
              });
            });
          });
        } else {
          return callback(null, 'nothing to transfer');
        }
      });
    } else {
      return callback(null, null);
    }
  };

  eprdWSgetToken = function(institute, patient, callback) {
    var Params, args, security, url;
    url = 'https://eprdtest.bqs.de/EPRDVSService/EPRDVSService.svc?singleWsdl';
    Params = [];
    Params = mapParamsToEPRDBase(Params, institute);
    Params = mapParamsToEPRDToken(Params, patient, callback);
    Params = packParams(Params);
    args = {
      'command': {
        'q1:Command': 'GETTRANSFERNR',
        'q1:MandantenLizenz': institute.eprdClientLizenz,
        'q1:MandantenNr': institute.eprdClientNr,
        'q1:Params': Params
      }
    };
    security = {};
    security.userName = "5E4E22A2-BAC7-44AD-8FCA-F54A3531768E";
    security.password = "6636-3750-0167-3447";
    return soap.createClient(url, function(err, client) {
      if (err != null) {
        console.log(err);
      }
      if (err != null) {
        return callback(err);
      }
      if (client == null) {
        return callback("client not established");
      }
      if (client.ExecuteCommand != null) {
        client.setSecurity(new soap.WSSecurity(security.userName, security.password));
        return client.ExecuteCommand(args, function(err, result) {
          var ref, transferNr;
          if (result.body != null) {
            console.log(result.body);
          } else {
            console.log(result);
          }
          if (err != null) {
            return callback(err);
          }
          transferNr = null;
          if ((((ref = result.ExecuteCommandResult) != null ? ref.Params.WSParam : void 0) != null) && result.ExecuteCommandResult.Params.WSParam[0].Name === 'TRANSFERNR') {
            transferNr = result.ExecuteCommandResult.Params.WSParam[0].Value;
          }
          if (transferNr === null) {
            return callback("Keine Transfernummer vom EPRD erhalten");
          }
          return callback(null, transferNr);
        });
      } else {
        if (err != null) {
          return callback("Verbindung zum EPRD nicht möglich");
        }
      }
    });
  };

  eprdWSImplantPlus = function(transferNr, institute, patient, implants, callback) {
    var Params, url;
    url = 'https://eprdtest.bqs.de/EPRDService/EPRDService.svc?singleWsdl';
    Params = [];
    return async.waterfall([
      function(next) {
        Params = mapParamsToEPRDBase(Params, institute);
        return next(null, Params);
      }, function(Params, next) {
        return mapParamsToEPRDImplantPlus(Params, transferNr, institute, patient, implants, function(err, Params) {
          if (err != null) {
            return next(err);
          }
          return next(null, Params);
        });
      }, function(Params, next) {
        Params = packParams(Params);
        return next(null, Params);
      }
    ], function(err, Params) {
      var args, security;
      if (err != null) {
        return callback(err);
      }
      args = {
        'command': {
          'q1:Command': 'IMPLANTATPLUS',
          'q1:MandantenLizenz': institute.eprdClientLizenz,
          'q1:MandantenNr': institute.eprdClientNr,
          'q1:Params': Params
        }
      };
      security = {};
      security.userName = "5E4E22A2-BAC7-44AD-8FCA-F54A3531768E";
      security.password = "6636-3750-0167-3447";
      return soap.createClient(url, function(err, client) {
        if (err != null) {
          return callback(err);
        }
        if (client == null) {
          return callback("client not established");
        }
        if (client.ExecuteCommand != null) {
          client.setSecurity(new soap.WSSecurity(security.userName, security.password));
          return client.ExecuteCommand(args, function(err, result) {
            var ref, ref1, ref2, ref3;
            if (result.body != null) {
              console.log(result.body);
            } else {
              console.log(result);
            }
            if (((ref = result.ExecuteCommandResult) != null ? ref.Params : void 0) != null) {
              console.log("eprdWSImplantPlus:", JSON.stringify(result.ExecuteCommandResult.Params));
            }
            if (err != null) {
              return callback(err);
            }
            if (((ref1 = result.ExecuteCommandResult) != null ? ref1.State : void 0) == null) {
              return callback("Fehler bei der Übertragung in das EPRD");
            }
            if ((result.ExecuteCommandResult.State === 'Service_Error' || result.ExecuteCommandResult.State === 'Error') && (((ref2 = result.ExecuteCommandResult.Params) != null ? (ref3 = ref2.WSParam[0]) != null ? ref3.Value : void 0 : void 0) != null)) {
              return callback(result.ExecuteCommandResult.Params.WSParam[0].Value);
            }
            if (result.ExecuteCommandResult.State !== 'OK') {
              return callback("Fehler bei der Übertragung in das EPRD");
            }
            return callback(null, result);
          });
        } else {
          if (err != null) {
            return callback("Verbindung zum EPRD nicht möglich");
          }
        }
      });
    });
  };

}).call(this);
