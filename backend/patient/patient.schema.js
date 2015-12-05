(function() {
  var ObjectId, Schema, mongoose, patientSchema, validateEPRD;

  mongoose = require('mongoose');

  Schema = mongoose.Schema;

  ObjectId = Schema.ObjectId;

  patientSchema = mongoose.Schema({
    vitabookId: {
      type: String
    },
    patientId: {
      type: String,
      required: true
    },
    refId: {
      type: ObjectId
    },
    sendToEprd: {
      type: Boolean
    },
    sendToVitabook: {
      type: Boolean
    },
    implantCardId: {
      type: String
    },
    implantCardSecurity: {
      type: String
    },
    gender: String,
    lastName: {
      type: String,
      required: true
    },
    firstName: String,
    birthdate: {
      type: Date,
      required: true
    },
    insurance: {
      type: String
    },
    insurant: {
      type: String
    },
    telephone: String,
    mobile: String,
    email: String,
    street: String,
    zipcode: Number,
    city: String,
    institute: {
      type: ObjectId,
      ref: 'Institute',
      required: true
    },
    field: String,
    saveDate: {
      type: Date,
      "default": Date.now
    },
    lastUpdated: {
      type: Date,
      "default": Date.now
    },
    lastSyncedManager: {
      type: Date,
      "default": null
    },
    lastSyncedVitabook: {
      type: Date,
      "default": null
    },
    creator: {
      type: ObjectId,
      ref: 'User',
      required: true
    },
    deleted: {
      type: Boolean,
      "default": false
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
    if (data.sendToEprd === true) {
      if (data.insurance == null) {
        err += "eine Versicherung benötigt\n";
      }
      if (data.insurant == null) {
        err += "eine Versicherungsnummer benötigt\n";
      }
      if (data.gender == null) {
        err += "ein Geschlecht/die Andrede benötigt\n";
      }
      if (data.saveDate == null) {
        err += "ein Aufnahmedatum benötigt\n";
      }
      if (err !== "") {
        err = "Bei Übertragung in das EPRD wird eine:\n" + err;
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

  patientSchema.pre('save', function(next) {
    return validateEPRD(this, next);
  });

  exports.validateEPRD = validateEPRD;

  exports.getSchema = function() {
    return patientSchema;
  };

}).call(this);
