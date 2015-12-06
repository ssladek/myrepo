(function() {
  var implantBaseDataService, routesService;

  routesService = require("./routes.service.js");

  implantBaseDataService = require('../implant-base-data/implant-base-data.service.js');

  module.exports = function(app, passport, user, environment) {
    app.get('/getArtsAutocomplete/:term', routesService.loggedIn, routesService.cleanParams, function(req, res) {
      return implantBaseDataService.getImplantBaseDataDistinct(req.user, {
        art: routesService.getRegex(req.params.term)
      }, 'art', function(err, arts) {
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
    app.get('/getManufacturersAutocomplete/:term', routesService.loggedIn, routesService.cleanParams, function(req, res) {
      return implantBaseDataService.getImplantBaseDataDistinct(req.user, {
        manufacturer: routesService.getRegex(req.params.term)
      }, 'manufacturer', function(err, manufacturers) {
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
    app.get('/getModelsAutocomplete/:term', routesService.loggedIn, routesService.cleanParams, function(req, res) {
      return implantBaseDataService.getImplantBaseDataDistinct(req.user, {
        model: routesService.getRegex(req.params.term)
      }, 'model', function(err, models) {
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
    return app.get('/getTypesAutocomplete/:term', routesService.loggedIn, routesService.cleanParams, function(req, res) {
      return implantBaseDataService.getImplantBaseDataDistinct(req.user, {
        type: routesService.getRegex(req.params.term)
      }, 'type', function(err, types) {
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
  };

}).call(this);
