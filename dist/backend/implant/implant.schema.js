(function() {
  var ObjectId, Schema, implantSchema, mongoose;

  mongoose = require('mongoose');

  Schema = mongoose.Schema;

  ObjectId = Schema.ObjectId;

  implantSchema = mongoose.Schema({
    vitabookId: {
      type: String
    },
    refId: {
      type: ObjectId
    },
    patient: {
      type: ObjectId,
      ref: 'Patient',
      required: true
    },
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
    bodyPart: {
      type: String,
      required: true
    },
    model: {
      type: String
    },
    type: {
      type: String
    },
    lot: {
      type: Number,
      required: true
    },
    serialNr: {
      type: Number,
      required: true
    },
    materialNr: {
      type: Number
    },
    storage: {
      type: String
    },
    operationId: {
      type: String
    },
    operationName: {
      type: String
    },
    operationFinished: {
      type: Boolean,
      required: true,
      "default": false
    },
    saveDate: {
      type: Date,
      "default": Date.now
    },
    lastUpdated: {
      type: Date,
      "default": Date.now
    },
    creator: {
      type: ObjectId,
      ref: 'User',
      required: true
    },
    institute: {
      type: ObjectId,
      ref: 'Institute',
      required: true
    },
    field: {
      type: String,
      required: true
    },
    controllDate: {
      type: Date,
      "default": Date.now
    },
    imOrExplant: {
      type: String,
      required: true
    },
    comment: String,
    sendToEprd: {
      type: Boolean
    },
    sendToVitabook: {
      type: Boolean
    },
    lastSyncedManager: {
      type: Date,
      "default": null
    },
    lastSyncedVitabook: {
      type: Date,
      "default": null
    },
    lastSyncedEprd: {
      type: Date,
      "default": null
    },
    deleted: {
      type: Boolean,
      "default": false
    }
  });

  exports.getSchema = function() {
    return implantSchema;
  };

}).call(this);
