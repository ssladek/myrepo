(function() {
  var COOKIE_MAX_AGE, ConnectRoles, MongoStore, SESSION_SECRET, app, bodyParser, compress, configDB, cookieParser, cronConfig, db, environment, express, fs, http, https, io, logger, mongoose, morgan, parseurl, passport, portHTTP, portHTTPS, session, soap, srvHTTP, srvHTTPs, sslOptions, user;

  SESSION_SECRET = 'myCatEatsPizza2015';

  COOKIE_MAX_AGE = null;

  require('./backend/helper/helper.service.js').checkEnvironmentVars();

  environment = require('./backend/config/config.js')();

  mongoose = require('mongoose');

  morgan = require('morgan');

  logger = require('./backend/logger/logger.js');

  require('pretty-error').start();

  http = require('http');

  https = require('https');

  portHTTP = process.env.PORT || 8080;

  portHTTPS = process.env.PORT_HTTPS || null;

  io = require('socket.io');

  soap = require('soap');

  express = require('express');

  cookieParser = require("cookie-parser");

  session = require("express-session");

  bodyParser = require("body-parser");

  compress = require('compression');

  parseurl = require('parseurl');

  passport = require('passport');

  require('./backend/config/passport')(passport);

  ConnectRoles = require('connect-roles');

  user = new ConnectRoles({
    failureHandler: function(req, res, action) {
      var accept;
      accept = req.headers.accept || '';
      res.status(403);
      if (~accept.indexOf('html')) {
        res.render('access-denied', {
          action: action
        });
      } else {
        res.send('Access Denied - You don\'t have permission to: ' + action);
      }
    },
    userProperty: 'user'
  });

  configDB = require('./backend/config/database.js')(environment);

  mongoose.connect(configDB.url, {
    auth: {
      authdb: configDB.authdb
    }
  }, function(err) {
    if (err) {
      return console.log('Database Error: ', err);
    }
  });

  db = mongoose.connection;

  db.on('error', console.error.bind(console, 'connection error:'));

  db.once('open', function() {
    return console.log("Database established");
  });

  MongoStore = require("connect-mongo")(session);

  cronConfig = require('./backend/config/cron-config.js');

  app = express();

  app.use(compress());

  app.use(cookieParser(SESSION_SECRET));

  app.use(bodyParser.urlencoded({
    extended: false,
    parameterLimit: 10000,
    limit: 1024 * 1024 * 10
  }));

  app.use(bodyParser.json({
    extended: false,
    parameterLimit: 10000,
    limit: 1024 * 1024 * 10
  }));

  app.use(session({
    secret: SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    rolling: true,
    store: new MongoStore({
      mongooseConnection: db
    }),
    cookie: {
      httpOnly: false,
      secure: false,
      maxAge: COOKIE_MAX_AGE
    }
  }));

  app.use(passport.initialize());

  app.use(passport.session());

  app.use(user.middleware());

  user.use(function(req, action) {
    if (!req.isAuthenticated()) {
      console.log("is not Authenticated");
      return action === 'login';
    }
  });

  user.use('patient', function(req) {
    if (req.user.permissionLevel === 'patient') {
      return true;
    }
  });

  user.use('employee-auto', function(req) {
    if (req.user.permissionLevel === 'employee-auto') {
      return true;
    }
  });

  user.use('employee', function(req) {
    if (req.user.permissionLevel === 'employee') {
      return true;
    }
  });

  user.use('institute', function(req) {
    if (req.user.permissionLevel === 'institute') {
      return true;
    }
  });

  user.use('nationalField', function(req) {
    if (req.user.permissionLevel === 'nationalField') {
      return true;
    }
  });

  user.use('national', function(req) {
    if (req.user.permissionLevel === 'national') {
      return true;
    }
  });

  user.use('superAdmin', function(req) {
    if (req.user.permissionLevel === 'superAdmin') {
      return true;
    }
  });

  user.use(function(req) {
    if (req.user.permissionLevel === 'superAdmin') {
      return true;
    }
  });

  require('./backend/routes/routes.js')(app, passport, user, environment);

  require('./backend/seed/seed.js').startSeeding(environment);

  if (process.env.NODE_ENV != null) {
    logger.info("NODE_ENV: " + process.env.NODE_ENV);
  } else {
    logger.info('no environment specified');
  }

  if (portHTTPS !== null) {
    console.log("getting certificate from: " + (__dirname + '/config/ssl/'));
    fs = require('fs');
    sslOptions = {
      key: fs.readFileSync(__dirname + '/config/ssl/server.key'),
      cert: fs.readFileSync(__dirname + '/config/ssl/server.crt'),
      ca: fs.readFileSync(__dirname + '/config/ssl/ca.crt'),
      requestCert: true,
      rejectUnauthorized: false
    };
    srvHTTPs = https.createServer(sslOptions, app).listen(portHTTPS, function() {
      logger.info("Secure Express server listening on port " + portHTTPS + " environment: " + environment);
      io = io.listen(srvHTTPs);
      logger.setIo(io);
      require('./backend/socket-io/socket-io-messenger.js').initSocketListener(io);
      require('./backend/api/hl7/hl7.js').createServer(io);
      return cronConfig.launchCrons(environment);
    });
  } else {
    srvHTTP = http.createServer(app).listen(portHTTP, function() {
      logger.info("Express server listening on port " + portHTTP + " environment: " + environment);
      io = io.listen(srvHTTP);
      logger.setIo(io);
      require('./backend/socket-io/socket-io-messenger.js').initSocketListener(io);
      require('./backend/api/hl7/hl7.js').createServer(io);
      return cronConfig.launchCrons(environment);
    });
  }

}).call(this);
