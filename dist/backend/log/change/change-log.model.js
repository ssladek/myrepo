(function() {
  var ChangeLogModel, ObjectId, Schema, changeLogSchema, err, mongoose;

  mongoose = require('mongoose');

  Schema = mongoose.Schema;

  ObjectId = Schema.ObjectId;

  changeLogSchema = mongoose.Schema({
    customer: {
      type: String,
      required: true
    },
    refId: {
      type: ObjectId
    },
    userId: {
      type: ObjectId,
      required: true
    },
    changedId: {
      type: ObjectId
    },
    model: {
      type: String,
      required: true
    },
    attribute: {
      type: String
    },
    oldValue: {
      type: String
    },
    newValue: {
      type: String
    },
    changeDate: {
      type: Date,
      required: true,
      "default": Date.now
    },
    lastSyncedManager: {
      type: Date,
      "default": null
    }
  });

  ChangeLogModel = null;

  try {
    ChangeLogModel = mongoose.model('ChangeLog');
  } catch (_error) {
    err = _error;
    ChangeLogModel = mongoose.model('ChangeLog', changeLogSchema);
  }

  module.exports = ChangeLogModel;

}).call(this);
