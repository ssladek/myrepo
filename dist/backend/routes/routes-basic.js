(function() {
  module.exports = function(app, passport, user, environment) {
    app.post('/signup', function(req, res, next) {
      return passport.authenticate('local-signup', function(err, user, info) {
        console.log(">>>>>>>>>>   err " + err + ", user " + user + ", info " + info);
        if ((err != null) || (user == null)) {
          console.log("401");
          return res.status(401).send({
            err: err
          });
        }
        return res.json({
          success: true
        });
      })(req, res, next);
    });
    app.post('/login', passport.authenticate('local-login', {
      failureMessage: "Invalid username or password"
    }), function(req, res) {
      return res.json({
        success: true
      });
    });
    app.get('/logout', function(req, res) {
      req.logout();
      return res.json({
        'success': true
      });
    });
    return app.get('/getAppUser', function(req, res) {
      var ref, ref1, ref2, ref3, ref4, responseUser;
      responseUser = {};
      if (((ref = req.user) != null ? ref._id : void 0) != null) {
        responseUser._id = req.user._id;
      }
      if (((ref1 = req.user) != null ? ref1.institute : void 0) != null) {
        responseUser.instituteId = req.user.institute;
      }
      if (((ref2 = req.user) != null ? ref2.field : void 0) != null) {
        responseUser.field = req.user.field;
      }
      if (((ref3 = req.user) != null ? ref3.lastName : void 0) != null) {
        responseUser.lastName = req.user.lastName;
      }
      if (((ref4 = req.user) != null ? ref4.permissionLevel : void 0) != null) {
        responseUser.permissionLevel = req.user.permissionLevel;
      }
      return res.json(responseUser);
    });
  };

}).call(this);
