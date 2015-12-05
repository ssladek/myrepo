(function() {
  var err, mongoose, patientSchema;

  mongoose = require('mongoose');

  patientSchema = require('./patient.schema.js').getSchema();

  try {
    module.exports = mongoose.model('Patient', patientSchema);
  } catch (_error) {
    err = _error;
    module.exports = mongoose.model('Patient');
  }

}).call(this);
