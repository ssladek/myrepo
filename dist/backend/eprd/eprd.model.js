(function() {
  var eprdSchema, err, mongoose;

  mongoose = require('mongoose');

  eprdSchema = require('./eprd.schema.js').getSchema();

  try {
    module.exports = mongoose.model('Eprd', eprdSchema);
  } catch (_error) {
    err = _error;
    module.exports = mongoose.model('Eprd');
  }

}).call(this);
