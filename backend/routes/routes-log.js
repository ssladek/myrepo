(function() {
  var changeLogService, routesService;

  routesService = require("./routes.service.js");

  changeLogService = require('../log/change/change-log.service.js');

  module.exports = function(app, passport, user, environment) {
    app.post('/getLogs', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return changeLogService.getLogs(req.user, req.body.filter, req.body.page, function(err, logs) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          logs: logs
        });
      });
    });
    app.post('/getAllLogs', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return changeLogService.getLogs(req.user, req.body.filter, -1, function(err, logs) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          logs: logs
        });
      });
    });
    app.post('/countLogs', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return changeLogService.countLogs(req.user, req.body.filter, function(err, countLogs) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          countLogs: countLogs
        });
      });
    });
    app.post('/getLogsCustomersList', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return changeLogService.getLogDistinct(req.user, req.body.filter, 'customer', function(err, customers) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          customers: customers
        });
      });
    });
    app.post('/getLogsModelsList', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return changeLogService.getLogDistinct(req.user, req.body.filter, 'model', function(err, models) {
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
    return app.post('/getLogsAttributesList', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return changeLogService.getLogDistinct(req.user, req.body.filter, 'attribute', function(err, attributes) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          attributes: attributes
        });
      });
    });
  };

}).call(this);
