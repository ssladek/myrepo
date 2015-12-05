(function() {
  var io, lastMessage, logger, mkdirp, socketIoMessenger, winston;

  winston = require('winston');

  mkdirp = require('mkdirp');

  socketIoMessenger = require('../socket-io/socket-io-messenger.js');

  mkdirp('logs', function(err) {
    if (err != null) {
      return console.log(err);
    }
  });

  io = null;

  lastMessage = null;

  winston.emitErrs = true;

  logger = new winston.Logger({
    transports: [
      new winston.transports.File({
        level: 'info',
        filename: 'logs/log.log',
        handleExceptions: true,
        json: true,
        maxsize: 5242880,
        maxFiles: 5,
        colorize: false,
        timestamp: true
      }), new winston.transports.Console({
        level: 'info',
        handleExceptions: true,
        json: false,
        colorize: true
      })
    ],
    exitOnError: false
  });

  winston.level = 'error';

  module.exports = logger;

  module.exports.stream = {
    write: function(message, encoding) {
      return logger.info(message);
    }
  };

  logger.on('logging', function(transport, level, message, meta) {
    if (io !== null && message !== lastMessage) {
      lastMessage = message;
      return socketIoMessenger.sendLog(io, {
        'message': message,
        'level': level,
        'meta': meta
      });
    }
  });

  module.exports.setIo = function(newIo) {
    console.log("setIO");
    return io = newIo;
  };

}).call(this);
