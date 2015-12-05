(function() {
  var sanitize;

  sanitize = require("mongo-sanitize");

  exports.cleanBody = function(req, res, next) {
    if ((req != null ? req.body : void 0) != null) {
      req.body = sanitize(req.body);
    }
    return next();
  };

  exports.cleanParams = function(req, res, next) {
    req.params = sanitize(req.params);
    return next();
  };

  exports.loggedIn = function(req, res, next) {
    if (req.user) {
      return next();
    } else {
      return res.redirect('/');
    }
  };

  exports.getRegex = function(term) {
    var err, regex;
    try {
      return regex = new RegExp(term, "i");
    } catch (_error) {
      err = _error;
      return regex = new RegExp('.*', "i");
    }
  };

}).call(this);
