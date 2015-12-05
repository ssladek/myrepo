(function() {
  module.exports = function() {
    var env;
    env = process.env.NODE_ENV || 'development';
    return env;
  };

}).call(this);
