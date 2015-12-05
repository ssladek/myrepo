(function() {
  var patientService, routesService;

  routesService = require("./routes.service.js");

  patientService = require('../patient/patient.service.js');

  module.exports = function(app, passport, user, environment) {
    return app.post('/api-klinik/createOrUpdatePatients', routesService.cleanBody, passport.authenticate('bearer', {
      session: false
    }), function(req, res) {
      var appUser, patientData, populate, ref;
      console.log('/api-klinik/createOrUpdateLogs');
      if (((ref = req.body) != null ? ref.patientData : void 0) != null) {
        patientData = req.body.patientData;
        appUser = req.user;
        console.log(patientData._id);
        populate = null;
        return patientService.getPatients(appUser, {
          patientId: patientData.patientId
        }, {}, populate, null, function(err, patients) {
          if (err != null) {
            return res.json({
              'err': err
            });
          }
          if ((patients != null) && patients.length === 0) {
            return patientService.createPatient(req.user, patientData, function(err, patient) {
              if (err != null) {
                return res.json({
                  'err': err
                });
              }
              return res.json({
                'patientId': patient
              });
            });
          } else if ((patients != null) && patients.length === 1) {
            patientData._id = patients[0]._id;
            return patientService.updatePatient(req.user, patientData, function(err, patient) {
              if (err != null) {
                return res.json({
                  'err': err
                });
              }
              return res.json({
                'patientId': patient._id
              });
            });
          } else {
            return res.json({
              'err': "api-klinik POST: Unbekannter Fehler Schnittstelle"
            });
          }
        });
      } else {
        return res.json({
          'err': "api-klinik POST: Patienteninformationen sind nicht vorhanden"
        });
      }
    });
  };

}).call(this);
