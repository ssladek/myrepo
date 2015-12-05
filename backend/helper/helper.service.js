(function() {
  var inspect, interfaceAddresses, logger, mime, path;

  path = require('path');

  mime = require('mime');

  inspect = require('eyespect').inspector();

  interfaceAddresses = require('interface-addresses');

  logger = require('../logger/logger.js');

  exports.powerLog = function(what) {
    var i, j, k, results;
    for (i = j = 0; j <= 5; i = ++j) {
      console.log('#######################################################################');
      console.log('\n\n\n');
    }
    console.log(what);
    results = [];
    for (i = k = 0; k <= 5; i = ++k) {
      console.log('#######################################################################');
      results.push(console.log('\n\n\n'));
    }
    return results;
  };

  exports.dumpError = function(err) {
    if (typeof err === 'object') {
      if (err.message) {
        console.log('\nMessage: ' + err.message);
      }
      if (err.stack) {
        console.log('\nStacktrace:');
        console.log('====================');
        console.log(err.stack);
      }
    } else {
      console.log('dumpError :: argument is not an object');
    }
  };

  exports.csvToJson = function(callback) {
    var Converter, converter, outputFilename, readStream, writeStream;
    Converter = require("csvtojson").Converter;
    converter = new Converter({
      toArrayString: true,
      trim: true,
      delimiter: ';'
    });
    console.log(__dirname + "/../seed/input.csv");
    readStream = require("fs").createReadStream(__dirname + "/../seed/input.csv");
    outputFilename = __dirname + "/../seed/outpuData.json";
    writeStream = require("fs").createWriteStream(outputFilename);
    readStream.pipe(converter).pipe(writeStream);
    return writeStream.on('finish', function(err) {
      var filename, mimetype;
      if (err != null) {
        return callback(err);
      }
      console.error('all writes are now complete.');
      filename = path.basename(outputFilename);
      mimetype = mime.lookup(outputFilename);
      return callback(null, {
        "filepath": outputFilename,
        "filename": filename,
        "mimetype": mimetype
      });
    });
  };

  exports.getIp = function() {
    var addresses, ip, port, protocol, ref, url;
    addresses = interfaceAddresses();
    console.log("addresses", addresses);
    protocol = process.env.PORT_HTTPS ? 'https://' : 'http://';
    port = process.env.PORT_HTTPS ? process.env.PORT_HTTPS : process.env.PORT_HTTP ? process.env.PORT_HTTP : 8080;
    ip = ((ref = addresses.eth0) != null ? ref : addresses.eth0) || addresses.en0;
    url = protocol + ip + ':' + port + '/';
    console.log(url);
    return url;
  };

  exports.determineType = function(checkMe) {
    var result, what;
    what = Object.prototype.toString;
    result = what.call(checkMe);
    switch (result) {
      case '[object String]':
        return 'string';
      case '[object Object]':
        return 'object';
      case '[object Array]':
        return 'array';
      case '[object Date]':
        return 'date';
      default:
        return null;
    }
  };

  exports.checkEnvironmentVars = function() {
    if ((process.env.NODE_ENV == null) || !(process.env.NODE_ENV !== 'test' || process.env.NODE_ENV !== 'production' || process.env.NODE_ENV !== 'development')) {
      logger.error("NODE_ENV nicht gesetzt oder fehlerhaft", process.env.NODE_ENV);
    }
    if ((process.env.REGISTER_TYPE == null) || !(process.env.REGISTER_TYPE !== 'local' || process.env.REGISTER_TYPE !== 'national')) {
      logger.error("REGISTER_TYPE nicht gesetzt oder fehlerhaft", process.env.REGISTER_TYPE);
    }
    if ((process.env.MONGODB_URL == null) && process.env.NODE_ENV === 'production') {
      logger.error("Keine Mongo Url gesetzt");
    }
    if ((process.env.MONGODB_ADMIN == null) && process.env.NODE_ENV === 'production') {
      logger.error("Keine Mongo Admin gesetzt");
    }
    if ((process.env.NATIONAL_REGISTER_URL == null) && process.env.REGISTER_TYPE === 'local') {
      logger.error("Keine Url zum nationalen Register festgelegt");
    }
    if ((process.env.SEED_FLAG == null) && process.env.NODE_ENV === 'production') {
      logger.warning("Keine CUSTOMER gesetzt");
    }
    if ((process.env.PORT_HTTPS == null) && (process.env.PORT_HTTP != null)) {
      logger.info("Keine HTTPS oder HTTP Port gesetzt");
    }
    if (process.env.PORT_HL7 == null) {
      logger.info("Keine PORT_HL7 gesetzt");
    }
    if (process.env.CUSTOMER == null) {
      logger.info("Keine CUSTOMER gesetzt");
    }
    if ((process.env.SEED_FLAG == null) && (typeof COUNT_PATIENT_SEEDS === "undefined" || COUNT_PATIENT_SEEDS === null)) {
      logger.info("Keine COUNT_PATIENT_SEEDS gesetzt");
    }
    if ((process.env.SEED_FLAG == null) && (typeof COUNT_IMPLANT_SEEDS === "undefined" || COUNT_IMPLANT_SEEDS === null)) {
      logger.info("Keine COUNT_IMPLANT_SEEDS gesetzt");
    }
  };

}).call(this);
