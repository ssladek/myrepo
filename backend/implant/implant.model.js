(function() {
  var err, implantSchema, mongoose;

  mongoose = require('mongoose');

  implantSchema = require('./implant.schema.js').getSchema();

  try {
    module.exports = mongoose.model('Implant', implantSchema);
  } catch (_error) {
    err = _error;
    module.exports = mongoose.model('Implant');
  }

}).call(this);
