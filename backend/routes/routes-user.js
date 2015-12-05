(function() {
  var routesService, userService;

  routesService = require("./routes.service.js");

  userService = require('../user/user.service.js');

  module.exports = function(app, passport, user, environment) {
    app.post('/createUser', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return userService.createUser(req.user, req.body.userData, function(err, userId) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          userId: userId
        });
      });
    });
    app.post('/getUsers', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return userService.getUsers(req.user, req.body.filter, {}, null, function(err, users) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          users: users
        });
      });
    });
    app.get('/getUsersAutocomplete/:term', routesService.loggedIn, routesService.cleanParams, function(req, res) {
      return userService.getUsers(req.user, {
        lastName: routesService.getRegex(req.params.term)
      }, {
        _id: 1,
        lastName: 1,
        field: 1
      }, 30, function(err, users) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          users: users
        });
      });
    });
    app.get('/getImplanter', routesService.loggedIn, function(req, res) {
      if (req.user._id != null) {
        return res.json({
          creator: req.user._id,
          institute: req.user.institute
        });
      } else {
        return res.json({
          err: 'keine User Id vorhanden'
        });
      }
    });
    app.get('/getCoWorkers', routesService.loggedIn, function(req, res) {
      return userService.getCoWorkers(req.user, function(err, coWorkers) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          coWorkers: coWorkers
        });
      });
    });
    app.put('/updateUser', routesService.loggedIn, routesService.cleanBody, function(req, res) {
      return userService.updateUser(req.user, req.body.userData, function(err, updatedUser) {
        if (err) {
          return res.json({
            err: err
          });
        }
        return res.json({
          user: updatedUser
        });
      });
    });
    return app["delete"]('/deleteUser/:userId', routesService.loggedIn, routesService.cleanParams, function(req, res) {
      return userService.deleteUser(req.user, req.params.userId, function(err, success) {
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
