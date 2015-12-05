(function() {
  var err, implantBaseDataSchema, mongoose;

  mongoose = require('mongoose');

  implantBaseDataSchema = require('./implant-base-data.schema.js').getSchema();

  try {
    module.exports = mongoose.model('ImplantBaseData', implantBaseDataSchema);
  } catch (_error) {
    err = _error;
    module.exports = mongoose.model('ImplantBaseData');
  }

}).call(this);
