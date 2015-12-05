(function() {
  module.exports = function(environment, overrideRegisterTypeForSeeding) {
    if (environment === 'test') {
      return {
        'url': "mongodb://localhost/implantat-register-test",
        'authdb': "admin"
      };
    } else if (environment === 'development') {
      if ((process.env.REGISTER_TYPE != null) && process.env.REGISTER_TYPE === 'national' && (overrideRegisterTypeForSeeding == null)) {
        return {
          'url': 'mongodb://localhost/implantat-register-dev-national',
          'authdb': 'admin'
        };
      } else {
        return {
          'url': 'mongodb://localhost/implantat-register-dev-lokal',
          'authdb': 'admin'
        };
      }
    } else if (environment === 'production') {
      return {
        'url': process.env.MONGODB_URL,
        'authdb': process.env.MONGODB_ADMIN || 'admin'
      };
    }
  };

}).call(this);
