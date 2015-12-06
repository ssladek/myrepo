(function() {
  var err, instituteSchema, mongoose;

  mongoose = require('mongoose');

  instituteSchema = require('./institute.schema.js').getSchema();

  try {
    module.exports = mongoose.model('Institute', instituteSchema);
  } catch (_error) {
    err = _error;
    module.exports = mongoose.model('Institute');
  }

}).call(this);
