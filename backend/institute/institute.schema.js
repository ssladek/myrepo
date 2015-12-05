(function() {
  var ObjectId, Schema, instituteSchema, mongoose, uuid, validateEPRD;

  mongoose = require('mongoose');

  Schema = mongoose.Schema;

  ObjectId = Schema.ObjectId;

  uuid = require('node-uuid');

  instituteSchema = mongoose.Schema({
    vitabookId: {
      type: String
    },
    instituteNr: String,
    name: String,
    responsiblePerson: {
      type: ObjectId,
      ref: 'User',
      "default": null
    },
    baseUrl: {
      type: String,
      required: true
    },
    telephone: String,
    fax: String,
    email: String,
    website: String,
    street: String,
    zipcode: Number,
    city: String,
    lastUpdated: {
      type: Date,
      "default": Date.now
    },
    eprdClientNr: String,
    eprdClientLizenz: String,
    locationNr: String,
    unitNr: Number,
    sendToEprd: {
      type: Boolean,
      "default": false
    },
    sendToVitabook: {
      type: Boolean,
      "default": true
    },
    lastSyncedManager: {
      type: Date,
      "default": null
    },
    deleted: {
      type: Boolean,
      "default": false
    },
    initialKey: {
      type: String,
      required: true,
      unique: true,
      "default": uuid.v4()
    }
  });

  validateEPRD = function(data, next) {
    var err, key, value;
    err = "";
    for (key in data) {
      value = data[key];
      if (value === '' || value === null) {
        data[key] = void 0;
      }
    }
    if (data.eprdClientNr != null) {
      if (data.instituteNr == null) {
        err += "eine Klinik Identitätskennung benötigt\n";
      }
      if (data.eprdClientLizenz == null) {
        err += "eine eprdClientLizenz benötigt\n";
      }
      if (data.locationNr == null) {
        err += "eine Standort Nummer benötigt\n";
      }
      if (data.unitNr == null) {
        err += "die Angabe einer Betriebssstätte benötigt\n";
      }
      if (err !== "") {
        err = "Bei Angabe einer EPRD Mandanten Nummer wird eine:\n" + err;
      }
    } else {
      if (data.instituteNr != null) {
        err += "einer Klinik Identitätskennung\n";
      }
      if (data.eprdClientLizenz != null) {
        err += "einer eprdClientLizenz\n";
      }
      if (data.locationNr != null) {
        err += "einer Standort Nummer\n";
      }
      if (data.unitNr != null) {
        err += "einer Betriebssstätte\n";
      }
      if (err !== "") {
        err = "Bei Angabe:\n" + err + "wird auch eine EPRD Mandanten Nummer benötigt.";
      }
    }
    if (err === "") {
      err = null;
    }
    if (err !== null) {
      console.log('err in pre Validation', err);
      return next(new Error(err));
    }
    return next();
  };

  instituteSchema.pre('save', function(next) {
    return validateEPRD(this, next);
  });

  exports.getSchema = function() {
    return instituteSchema;
  };

  exports.validateEPRD = validateEPRD;

}).call(this);
