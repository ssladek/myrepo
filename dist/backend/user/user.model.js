(function() {
  var ObjectId, Schema, bcrypt, err, mongoose, sha1, userSchema, uuid;

  mongoose = require('mongoose');

  bcrypt = require('bcrypt');

  sha1 = require('sha1');

  Schema = mongoose.Schema;

  ObjectId = Schema.ObjectId;

  uuid = require('node-uuid');

  userSchema = mongoose.Schema({
    refId: {
      type: ObjectId
    },
    vitabookId: {
      type: String
    },
    gender: String,
    lastName: {
      type: String,
      required: true
    },
    firstName: String,
    telephone: String,
    mobile: String,
    email: {
      type: String,
      unique: true,
      required: true
    },
    password: String,
    vitabookPassword: String,
    token: {
      type: String,
      required: true,
      "default": uuid.v4()
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
    street: String,
    zipcode: Number,
    city: String,
    permissionLevel: {
      type: String,
      required: true,
      "default": 'patient'
    },
    institute: {
      type: ObjectId,
      ref: 'Institute',
      required: false,
      "default": null
    },
    field: String,
    active: {
      type: Boolean,
      "default": false
    },
    deleted: {
      type: Boolean,
      "default": false
    }
  });

  userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
  };

  userSchema.methods.generateVitabookPassword = function(password) {
    return sha1(password);
  };

  userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
  };

  try {
    module.exports = mongoose.model('User', userSchema);
  } catch (_error) {
    err = _error;
    module.exports = mongoose.model('User');
  }

}).call(this);
