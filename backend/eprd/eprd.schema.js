(function() {
  var ObjectId, Schema, eprdSchema, mongoose, validateEPRD;

  mongoose = require('mongoose');

  Schema = mongoose.Schema;

  ObjectId = Schema.ObjectId;

  eprdSchema = mongoose.Schema({
    implant: {
      type: ObjectId,
      ref: 'Implant',
      required: true
    },
    institute: {
      type: ObjectId,
      ref: 'Institute',
      required: true
    },
    artikeltyp: {
      type: String,
      required: true
    },
    hersteller: {
      type: String,
      required: true
    },
    gelenk: {
      type: String,
      required: true
    },
    seite: {
      type: String,
      required: true
    },
    arteingriff: {
      type: String,
      required: true
    },
    vorop: {
      type: String
    },
    wechselgrund: {
      type: String
    },
    freitext: {
      type: String
    },
    menge: {
      type: String,
      "default": 1
    },
    einheit: {
      type: String,
      "default": 1
    },
    lastUpdated: {
      type: Date,
      "default": Date.now
    },
    zweizeitwechsel: {
      type: String
    },
    deleted: {
      type: Boolean,
      "default": false
    },
    lastSyncedManager: {
      type: Date,
      "default": null
    },
    lastSyncedEprd: {
      type: Date,
      "default": null
    }
  });

  validateEPRD = function(data, next) {
    var err, errComponent, key, value;
    err = "";
    for (key in data) {
      value = data[key];
      if (value === '' || value === null) {
        data[key] = void 0;
      }
    }
    if (data.arteingriff === '1') {
      errComponent = "";
      if (data.vorop == null) {
        errComponent += "die Vorop benötigt\n";
      }
      if (errComponent !== "") {
        err += "Bei einer Erstoperation wird:\n" + errComponent;
      }
    } else if (data.arteingriff === '3') {
      errComponent = "";
      if (data.wechselgrund == null) {
        errComponent += "der Wechselgrund benötigt\n";
      }
      if (data.wechselgrund == null) {
        errComponent += "die Information zum Zweizeitwechsel benötigt\n";
      }
      if (errComponent !== "") {
        err += "Bei einer Wechselop wird:\n" + errComponent;
      }
    }
    if (err === "") {
      err = null;
    }
    if (err !== null) {
      return next(new Error(err));
    }
    return next();
  };

  eprdSchema.pre('save', function(next) {
    return validateEPRD(this, next);
  });

  exports.validateEPRD = validateEPRD;

  exports.getSchema = function() {
    return eprdSchema;
  };

}).call(this);
