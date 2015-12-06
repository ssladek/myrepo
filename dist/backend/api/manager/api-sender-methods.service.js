(function() {
  var InstituteModel, environment, registerConfig, registerName, registerType, request, self;

  request = require('request');

  environment = require('../../config/config.js')();

  registerConfig = require('../../config/register-config.js');

  registerType = registerConfig.getType();

  InstituteModel = require('../../institute/institute.model.js');

  self = this;

  if (registerType === 'national') {
    registerName = 'lokale';
  } else {
    registerName = 'nationale';
  }

  exports.bsonToJson = function(bson) {
    var attr, json, value;
    if (bson.toObject != null) {
      json = bson.toObject({
        'depopulate': true
      });
      for (attr in json) {
        value = json[attr];
        if (value === null) {
          delete json[attr];
        } else if (typeof value === 'object') {
          json[attr] = value.toString();
        }
      }
      return json;
    } else {
      if (bson._id != null) {
        bson._id = bson._id.toString();
      }
      if (bson.institute != null) {
        bson.institute = bson.institute.toString();
      }
      if (bson.creator != null) {
        bson.creator = bson.creator.toString();
      }
      if (bson.patient != null) {
        bson.patient = bson.patient.toString();
      }
      return bson;
    }
  };

  exports.emitGet = function(url, token, callback) {
    if ((token == null) || token === null) {
      return "kein Token vorhanden";
    }
    return request.get(url).auth(null, null, true, token).on('response', function(res) {
      var data;
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
            if (data == null) {
              return callback("Keine Antwortdaten erhalten bei der Anfrage an das " + registerName);
            }
            return callback(null, data);
          } catch (_error) {
            err = _error;
            require('../../helper/helper.service.js').dumpError(err);
            console.log("response error (api local/national), " + err);
            return callback("Fehler bei der Anfrage an das " + registerName + " Register Antwortdaten ungültig " + err);
          }
        });
      } else {
        return callback("Fehler bei der Anfrage an das " + registerName + " Register keine Verbindung (A)");
      }
    }).on('error', function(err) {
      return callback("Fehler bei der Anfrage an das " + registerName + " Register keine Verbindung (B)");
    });
  };

  exports.emitPost = function(url, data, token, callback) {
    if ((token == null) || token === null) {
      return "kein Token vorhanden";
    }
    return request.post(url).auth(null, null, true, token).json(data).on('response', function(res) {
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
            if (data.ids != null) {
              return callback(null, data.ids);
            } else if (data.id != null) {
              return callback(null, data.id);
            } else if (data.success != null) {
              return callback(null, data.success);
            } else {
              console.log("data received post:", data);
              return callback("Fehler bei der Übertragung in das " + registerName + " Register wurde nicht gespeichert");
            }
          } catch (_error) {
            err = _error;
            console.log("response error (api local/national), " + err);
            return callback("Fehler bei der Übertragung in das " + registerName + " Register Antwortdaten ungültig");
          }
        });
      } else {
        console.log("res POST manager", res);
        return callback("Fehler bei der Übertragung in das " + registerName + " Register keine Verbindung (A)");
      }
    }).on('error', function(err) {
      console.log("err POST manager", err);
      return callback("Fehler bei der Übertragung in das " + registerName + " Register keine Verbindung (B)");
    });
  };

  exports.emitPut = function(url, data, token, callback) {
    if ((token == null) || token === null) {
      return "kein Token vorhanden";
    }
    return request.put(url).auth(null, null, true, token).json(data).on('response', function(res) {
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
            if (data.objects != null) {
              return callback(null, data.objects);
            } else if (data.object != null) {
              return callback(null, data.object);
            } else {
              return callback("Fehler bei der Übertragung in das " + registerName + " Register wurde nicht gespeichert");
            }
          } catch (_error) {
            err = _error;
            if (data != null) {
              console.log("err put", data.toString());
            }
            return callback("Fehler bei der Übertragung in das " + registerName + " Register Antwortdaten ungültig");
          }
        });
      } else {
        return callback("Fehler bei der Übertragung in das " + registerName + " Register keine Verbindung");
      }
    }).on('error', function(err) {
      return callback("Fehler bei der Übertragung in das " + registerName + " Register keine Verbindung");
    });
  };

  exports.emitDelete = function(url, token, callback) {
    if ((token == null) || token === null) {
      return "kein Token vorhanden";
    }
    return request.del(url).auth(null, null, true, token).on('response', function(res) {
      var data;
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
            if (data.successArray != null) {
              return callback(null, data.successArray);
            } else if (data.success != null) {
              return callback(null, data.success);
            } else {
              return callback("Fehler bei der Übertragung in das " + registerName + " Register wurde nicht gespeichert");
            }
          } catch (_error) {
            err = _error;
            if (data != null) {
              console.log("err del", data.toString());
            }
            return callback("Fehler bei der Übertragung in das " + registerName + " Register Antwortdaten ungültig");
          }
        });
      } else {
        return callback("Fehler bei der Übertragung in das " + registerName + " Register keine Verbindung");
      }
    }).on('error', function(err) {
      return callback("Fehler bei der Übertragung in das " + registerName + " Register keine Verbindung");
    });
  };

  exports.getBaseUrl = function(instituteId, callback) {
    if (registerType === 'national') {
      return InstituteModel.findOne({
        _id: instituteId,
        deleted: false
      }, function(err, institute) {
        if (err != null) {
          return callback(err);
        }
        if (institute == null) {
          return callback('Keine Klinik zum Datensatz vorhanden');
        }
        if (institute.baseUrl == null) {
          return callback('Adresse zum lokalen Server unbekannt');
        }
        return callback(null, institute.baseUrl.replace(/\/$/g, '') + '/api');
      });
    } else {
      return registerConfig.getNationalUrl(environment, callback);
    }
  };

  exports.getNationalUrl = function(callback) {
    return registerConfig.getNationalUrl(environment, callback);
  };

}).call(this);
