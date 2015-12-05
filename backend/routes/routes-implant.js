(function() {
  var implantService, pdfService, routesService;

  routesService = require("./routes.service.js");

  implantService = require('../implant/implant.service.js');

  pdfService = require('../pdf/pdf.service.js');

  module.exports = function(app, passport, user, environment) {
    app.post('/createImplant', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return implantService.createImplant(req.user, req.body.implantData, function(err, implant) {
        if (err) {
          return res.json({
            err: err
          });
        } else if ((implant != null ? implant._id : void 0) == null) {
          return res.json({
            err: "Speichern nicht abgeschlossen"
          });
        }
        return res.json({
          implantId: implant._id
        });
      });
    });
    app.post('/getImplants', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return implantService.getImplants(req.user, req.body.filter, req.body.page, function(err, implants) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          implants: implants
        });
      });
    });
    app.post('/getAllImplants', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return implantService.getImplants(req.user, req.body.filter, -1, function(err, implants) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          implants: implants
        });
      });
    });
    app.post('/countImplants', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return implantService.countImplants(req.user, req.body.filter, function(err, countImplants) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          countImplants: countImplants
        });
      });
    });
    app.get('/getImplantsFromPreviousOperations/:operationId', routesService.loggedIn, routesService.cleanParams, function(req, res) {
      return implantService.getImplants(req.user, {
        operationId: req.params.operationId
      }, -1, function(err, implantsFromPreviousOperations) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          implantsFromPreviousOperations: implantsFromPreviousOperations
        });
      });
    });
    app.post('/getArtsList', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return implantService.getImplantDistinct(req.user, req.body.filter, 'art', false, function(err, arts) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          arts: arts
        });
      });
    });
    app.post('/getManufacturersList', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return implantService.getImplantDistinct(req.user, req.body.filter, 'manufacturer', false, function(err, manufacturers) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          manufacturers: manufacturers
        });
      });
    });
    app.post('/getModelsList', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return implantService.getImplantDistinct(req.user, req.body.filter, 'model', false, function(err, models) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          models: models
        });
      });
    });
    app.post('/getTypesList', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return implantService.getImplantDistinct(req.user, req.body.filter, 'type', false, function(err, types) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          types: types
        });
      });
    });
    app.post('/getSerialRangeMinMax', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return implantService.getSerialRangeMinMax(req.user, req.body.filter, function(err, range) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          range: range
        });
      });
    });
    app.post('/getLotRangeMinMax', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return implantService.getLotRangeMinMax(req.user, req.body.filter, function(err, range) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          range: range
        });
      });
    });
    app.get('/getImplantPdf/:implantId/:operationId', routesService.loggedIn, routesService.cleanParams, function(req, res) {
      return pdfService.createPDF(req.user, req.params.implantId, req.params.operationId, null, function(err, path) {
        var had_error, stream;
        if (err != null) {
          return res.json({
            'err': err
          });
        }
        if (path == null) {
          return res.json({
            'err': "Kein Dateipfad vorhanden"
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
    app.put('/updateImplant', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return implantService.updateImplant(req.user, req.body.implantData, function(err, updatedImplant) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          implant: updatedImplant
        });
      });
    });
    return app["delete"]('/deleteImplant/:implantId', routesService.loggedIn, routesService.cleanParams, function(req, res) {
      return implantService.deleteImplant(req.user, req.params.implantId, function(err, success) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          success: success
        });
      });
    });
  };

}).call(this);
