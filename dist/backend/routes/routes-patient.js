(function() {
  var patientService, routesService;

  routesService = require("./routes.service.js");

  patientService = require('../patient/patient.service.js');

  module.exports = function(app, passport, user, environment) {
    app.post('/createPatient', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return patientService.createPatient(req.user, req.body.patientData, function(err, patientId) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          patientId: patientId
        });
      });
    });
    app.post('/getPatients', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      var limit, populate, selector;
      selector = {};
      populate = {
        "institute": {
          eprdClientNr: 0,
          eprdClientLizenz: 0,
          initialKey: 0
        },
        "creator": {
          password: 0,
          vitabookPassword: 0,
          token: 0
        }
      };
      limit = null;
      return patientService.getPatients(req.user, req.body.filter, selector, populate, limit, function(err, patients) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          patients: patients
        });
      });
    });
    app.get('/getPatientsAutocomplete/:term', routesService.loggedIn, routesService.cleanParams, function(req, res) {
      var limit, populate, selector;
      selector = {
        _id: 1,
        lastName: 1,
        firstName: 1,
        birthdate: 1,
        sendToEprd: 1,
        patientId: 1,
        institute: 1
      };
      populate = {
        "institute": {
          sendToEprd: 1
        }
      };
      limit = null;
      return patientService.getPatients(req.user, {
        lastName: routesService.getRegex(req.params.term)
      }, selector, populate, limit, function(err, patients) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          patients: patients
        });
      });
    });
    app.put('/updatePatient', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return patientService.updatePatient(req.user, req.body.patientData, function(err, updatedPatient) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          patient: updatedPatient
        });
      });
    });
    return app["delete"]('/deletePatient/:patientId', routesService.loggedIn, routesService.cleanParams, function(req, res) {
      return patientService.deletePatient(req.user, req.params.patientId, function(err, success) {
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
