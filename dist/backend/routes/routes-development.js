(function() {
  var eprdApiService, helperService, implantService, ordermedApiService, pdfService, routesService;

  routesService = require("./routes.service.js");

  implantService = require('../implant/implant.service.js');

  ordermedApiService = require('../api/ordermed-api/ordermed-api.service.js');

  eprdApiService = require('../api/eprd-api/eprd-api.service.js');

  pdfService = require('../pdf/pdf.service.js');

  helperService = require('../helper/helper.service.js');

  module.exports = function(app, passport, user, environment) {
    app.get('/eprd/test', routesService.loggedIn, function(req, res) {
      if (req.user.is('superAdmin')) {
        return eprdApiService.eprdWSsaveImplant({}, function(err, success) {
          if (err || success !== true) {
            return res.json({
              'err': err
            });
          }
          return res.json({
            'success': true
          });
        });
      } else {
        return res.json({
          'err': 'no permission'
        });
      }
    });
    app.get('/vitabook/test/:method', routesService.loggedIn, function(req, res) {
      console.log("/vitabook/test/" + req.params.method);
      if (req.user.is('superAdmin')) {
        return ordermedApiService.sendTestToVitabook(req.user, req.params.method, function(err, result) {
          if (err != null) {
            console.log("err (routes)", err);
          }
          if ((err == null) && (result != null)) {
            return console.log("result (routes)", result);
          }
        });
      } else {
        return res.json({
          'err': 'no permission'
        });
      }
    });
    app.get('/pdf/test', routesService.loggedIn, function(req, res) {
      if (req.user.is('superAdmin')) {
        console.log("/pdf/test");
        return implantService.getImplants(req.user, req.body.filter, req.body.page, function(err, implants) {
          if (err != null) {
            return res.json({
              'err': err
            });
          }
          if ((implants != null) && implants.length === 0) {
            return res.json({
              'err': "Implantat nicht vorhanden"
            });
          }
          return pdfService.createPDF(req.user, implants[0]._id, null, function(err, path) {
            var had_error, stream;
            if (err || (path == null)) {
              return res.json({
                'err': err
              });
            }
            stream = fs.createReadStream(path, {
              bufferSize: 64 * 1024
            });
            stream.pipe(res);
            had_error = false;
            stream.on('error', function(err) {
              if (err != null) {
                console.log("err", err);
              }
              return had_error = true;
            });
            return stream.on('close', function() {
              if (!had_error) {
                return fs.unlink(path);
              }
            });
          });
        });
      } else {
        return res.json({
          'err': 'no permission'
        });
      }
    });
    return app.get('/helper/csv2json', routesService.loggedIn, routesService.cleanParams, function(req, res) {
      return helperService.csvToJson((function(err, response) {
        var filestream;
        if (err) {
          return res.json({
            err: err
          });
        }
        res.setHeader('Content-disposition', 'attachment; filename=' + response.filename);
        res.setHeader('Content-type', response.mimetype);
        filestream = fs.createReadStream(response.filepath);
        return filestream.pipe(res);
      }));
    });
  };

}).call(this);
