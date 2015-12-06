(function() {
  var ObjectId, Schema, implantBaseDataSchema, mongoose;

  mongoose = require('mongoose');

  Schema = mongoose.Schema;

  ObjectId = Schema.ObjectId;

  implantBaseDataSchema = mongoose.Schema({
    art: {
      type: String,
      required: true
    },
    manufacturer: {
      type: String,
      required: true
    },
    referenceNr: {
      type: String,
      required: true
    },
    model: {
      type: String
    },
    type: {
      type: String
    },
    uploadBatchNr: {
      type: Number
    },
    saveDate: {
      type: Date,
      "default": Date.now
    },
    lastSyncedManager: {
      type: Date,
      "default": Date.now
    },
    lastUpdated: {
      type: Date,
      "default": Date.now
    }
  });

  exports.getSchema = function() {
    return implantBaseDataSchema;
  };

}).call(this);
