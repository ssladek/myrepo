(function() {
  var nationalRegisterUrl;

  nationalRegisterUrl = process.env.NATIONAL_REGISTER_URL || 'http://localhost:8090/api';

  exports.getType = function() {
    var registerType;
    registerType = process.env.REGISTER_TYPE || 'local';
    return registerType;
  };

  exports.getNationalUrl = function(environment, callback) {
    if (environment === 'production') {
      return callback(null, nationalRegisterUrl);
    } else if (environment === 'development') {
      return callback(null, nationalRegisterUrl);
    } else if (environment === 'test') {
      return callback(null, true);
    } else {
      return callback('no valid environment');
    }
  };

}).call(this);
