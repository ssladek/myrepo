(function() {
  exports.getEmailConfig = function(environment) {
    if (environment === 'development') {
      return {
        'user': "mailer@360-disrupt.de",
        'pass': 'm#1lergdhdgsjhgfsv##++*',
        'from': "Implantatregister <kontakt@ordermed.com>",
        'host': "grus.uberspace.de",
        'port': "587"
      };
    } else if (environment === 'development-uberspace') {
      return {
        'user': "mailer@360-disrupt.de",
        'pass': 'm#1lergdhdgsjhgfsv##++*',
        'from': "Implantatregister <kontakt@ordermed.com>",
        'host': "grus.uberspace.de",
        'port': "587"
      };
    } else if (environment === 'test') {
      return {
        'user': "mailer@360-disrupt.de",
        'pass': 'm#1lergdhdgsjhgfsv##++*',
        'from': "Implantatregister <kontakt@ordermed.com>",
        'host': "grus.uberspace.de",
        'port': "587"
      };
    } else if (environment === 'production') {
      return {
        'user': "mailer@360-disrupt.de",
        'pass': 'm#1lergdhdgsjhgfsv##++*',
        'from': "Implantatregister <kontakt@ordermed.com>",
        'host': "grus.uberspace.de",
        'port': "587"
      };
    }
  };

  exports.getRecipient = function(environment) {
    if (environment === 'development') {
      return 'hallo@vierhundertvier.com';
    } else if (environment === 'development-uberspace') {
      return 'hallo@vierhundertvier.com';
    } else if (environment === 'test') {
      return 'hallo@vierhundertvier.com';
    } else if (environment === 'production') {
      return 'hallo@vierhundertvier.com';
    }
  };

}).call(this);
