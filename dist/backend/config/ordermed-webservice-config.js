(function() {
  var environment;

  environment = require('./config.js')();

  exports.getWebserviceUrl = function() {
    if (environment === 'test') {
      return 'http://dev.order-med.de/Webservices/Client/Implantat-Manager.asmx?wsdl';
    } else if (environment === 'development') {
      return 'http://dev.order-med.de/Webservices/Client/Implantat-Manager.asmx?wsdl';
    } else if (environment === 'production') {
      return 'http://order-med.de/Webservices/Client/Implantat-Manager.asmx?wsdl';
    }
  };

}).call(this);
