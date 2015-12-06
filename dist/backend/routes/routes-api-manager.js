(function() {
  var apiReceiverService, routesService;

  routesService = require("./routes.service.js");

  apiReceiverService = require("../api/manager/api-receiver.service.js");

  module.exports = function(app, passport, user, environment) {
    app.get('/ordermed/updateInstitutes', routesService.loggedIn, function(req, res) {
      if (req.user.is('superAdmin')) {
        return ordermedApiService.ordermedWSgetInstitutes(function(err, success) {
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
    app.get('/api/alive', function(req, res) {
      var ip, register;
      ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
      register = require('./config/register-config.js').getType();
      return res.json({
        a: environment = register,
        ip: ip
      });
      if (ip === '127.0.0.12') {
        return res.end();
      }
    });
    app.get('/api/getInitial/:initialKey', passport.authenticate('bearer', {
      session: false
    }), routesService.cleanParams, function(req, res) {
      console.log('/api/getInitial/' + req.params.initialKey);
      return apiReceiverService.getInitial(req.user, req.params.initialKey, function(err, initial) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json(initial);
      });
    });
    app.post('/api/createOrUpdateInstitutes', routesService.cleanBody, passport.authenticate('bearer', {
      session: false
    }), function(req, res) {
      console.log('/api/createOrUpdateInstitutes');
      return apiReceiverService.createOrUpdateInstitutes(req.body, function(err, instituteIds) {
        if (err) {
          return res.json({
            'err': err
          });
        }
        return res.json({
          'ids': instituteIds
        });
      });
    });
    app.post('/api/createOrUpdateUsers', routesService.cleanBody, passport.authenticate('bearer', {
      session: false
    }), function(req, res) {
      console.log('/api/createOrUpdateUsers');
      return apiReceiverService.createOrUpdateUsers(req.body, function(err, userIds) {
        if (err) {
          return res.json({
            'err': err
          });
        }
        return res.json({
          'ids': userIds
        });
      });
    });
    app.put('/api/updateUser', passport.authenticate('bearer', {
      session: false
    }), routesService.cleanBody, function(req, res) {
      console.log('/api/updateUser');
      return apiReceiverService.updateUser(req.body, function(err, updatedUser) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          'object': updatedUser
        });
      });
    });
    app.post('/api/createOrUpdatePatients', routesService.cleanBody, passport.authenticate('bearer', {
      session: false
    }), function(req, res) {
      console.log('/api/createOrUpdatePatients');
      return apiReceiverService.createOrUpdatePatients(req.body, function(err, patientIds) {
        if (err) {
          return res.json({
            'err': err
          });
        }
        return res.json({
          'ids': patientIds
        });
      });
    });
    app.post('/api/createOrUpdateImplants', routesService.cleanBody, passport.authenticate('bearer', {
      session: false
    }), function(req, res) {
      console.log('/api/createOrUpdateImplants');
      return apiReceiverService.createOrUpdateImplants(req.body, function(err, implantIds) {
        if (err) {
          return res.json({
            'err': err
          });
        }
        return res.json({
          'ids': implantIds
        });
      });
    });
    app.post('/api/createOrUpdateEprds', routesService.cleanBody, passport.authenticate('bearer', {
      session: false
    }), function(req, res) {
      console.log('/api/createOrUpdateEprds');
      return apiReceiverService.createOrUpdateEprds(req.body, function(err, eprdIds) {
        if (err) {
          return res.json({
            'err': err
          });
        }
        return res.json({
          'ids': eprdIds
        });
      });
    });
    app.get('/api/getImplantBaseData/:startDate', passport.authenticate('bearer', {
      session: false
    }), routesService.cleanParams, function(req, res) {
      console.log('/api/readImplantBaseData/' + req.params.startDate);
      return apiReceiverService.readImplantBaseData(req.params.startDate, function(err, implantBaseData) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          'implantBaseData': implantBaseData
        });
      });
    });
    app.post('/api/createOrUpdateImplantBaseData', routesService.cleanBody, passport.authenticate('bearer', {
      session: false
    }), function(req, res) {
      console.log('/api/createOrUpdateImplantBaseData');
      return apiReceiverService.createOrUpdateImplantBaseData(req.body, function(err, success) {
        if (err) {
          return res.json({
            'err': err
          });
        }
        return res.json({
          'success': success
        });
      });
    });
    app.post('/api/createOrUpdateUpdateLogs', routesService.cleanBody, passport.authenticate('bearer', {
      session: false
    }), function(req, res) {
      console.log('/api/createOrUpdateUpdateLogs');
      return apiReceiverService.createOrUpdateLogs('updateLogs', req.body, function(err, logIds) {
        if (err) {
          return res.json({
            'err': err
          });
        }
        return res.json({
          'ids': logIds
        });
      });
    });
    return app.post('/api/createOrUpdateLogs', routesService.cleanBody, passport.authenticate('bearer', {
      session: false
    }), function(req, res) {
      console.log('/api/createOrUpdateChangeLogs');
      return apiReceiverService.createOrUpdateLogs('changeLogs', req.body, function(err, logIds) {
        if (err) {
          return res.json({
            'err': err
          });
        }
        return res.json({
          'ids': logIds
        });
      });
    });
  };

}).call(this);
