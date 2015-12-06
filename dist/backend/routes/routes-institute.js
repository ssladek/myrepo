(function() {
  var instituteService, routesService;

  routesService = require("./routes.service.js");

  instituteService = require('../institute/institute.service.js');

  module.exports = function(app, passport, user, environment) {
    app.post('/createInstitute', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return instituteService.createInstitute(req.user, req.body.instituteData, function(err, instituteId) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          instituteId: instituteId
        });
      });
    });
    app.get('/getInitialFromNationalRegister/:initialKey', routesService.loggedIn, routesService.cleanParams, function(req, res) {
      return instituteService.getInitialFromNationalRegister(req.user, req.params.initialKey, function(err, success) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          sucess: success
        });
      });
    });
    app.post('/getInstitutes', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return instituteService.getInstitutes(req.user, req.body.filter, function(err, institutes) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          institutes: institutes
        });
      });
    });
    app.put('/updateInstitute', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return instituteService.updateInstitute(req.user, req.body.instituteData, function(err, updatedInstitute) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          institute: updatedInstitute
        });
      });
    });
    return app["delete"]('/deleteInstitute/:instituteId', routesService.loggedIn, routesService.cleanParams, function(req, res) {
      return instituteService.deleteInstitute(req.user, req.params.instituteId, function(err, success) {
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
