(function() {
  var ObjectId, Schema, UpdateLogModel, err, mongoose, updateLogSchema;

  mongoose = require('mongoose');

  Schema = mongoose.Schema;

  ObjectId = Schema.ObjectId;

  updateLogSchema = mongoose.Schema({
    customer: {
      type: String,
      required: true
    },
    refId: {
      type: ObjectId
    },
    from: {
      type: String,
      required: true
    },
    to: {
      type: String,
      required: true
    },
    operation: {
      type: String,
      required: true
    },
    success: {
      type: Boolean,
      required: true
    },
    saveDate: {
      type: Date,
      required: true,
      "default": Date.now,
      expires: 60 * 60 * 24 * 7
    },
    lastSyncedManager: {
      type: Date,
      "default": null
    }
  });

  UpdateLogModel = null;

  try {
    UpdateLogModel = mongoose.model('UpdateLog');
  } catch (_error) {
    err = _error;
    UpdateLogModel = mongoose.model('UpdateLog', updateLogSchema);
  }

  module.exports = UpdateLogModel;

}).call(this);
