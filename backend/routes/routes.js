(function() {
  var express;

  express = require('express');

  module.exports = function(app, passport, user, environment) {
    var path, rootPath;
    rootPath = __dirname + '/../../../../';
    console.log("rootPath", rootPath);
    app.use('/bower_components', express["static"](rootPath + 'bower_components'));
    app.use('/partials', express["static"](__dirname + '/../../../partials'));
    path = __dirname + '/../../';
    console.log(path);
    app.use(express["static"](path));
    require('./routes-api-cloud.js')(app, passport, user, environment);
    require('./routes-api-manager.js')(app, passport, user, environment);
    require('./routes-basic.js')(app, passport, user, environment);
    require('./routes-implant-base-data.js')(app, passport, user, environment);
    require('./routes-implant.js')(app, passport, user, environment);
    require('./routes-institute.js')(app, passport, user, environment);
    require('./routes-log.js')(app, passport, user, environment);
    require('./routes-patient.js')(app, passport, user, environment);
    require('./routes-user.js')(app, passport, user, environment);
    if (environment === 'development') {
      return require('./routes-development.js')(app, passport, user, environment);
    }
  };

}).call(this);
