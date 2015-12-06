(function() {
  var BearerStrategy, LocalStrategy, ObjectId, UserModel, apiSenderService, async;

  async = require('async');

  BearerStrategy = require('passport-http-bearer').Strategy;

  LocalStrategy = require('passport-local').Strategy;

  UserModel = require('../user/user.model.js');

  ObjectId = require('mongoose').Types.ObjectId;

  apiSenderService = require('../api/manager/api-sender.service.js');

  module.exports = function(passport) {
    var saveUser;
    passport.serializeUser(function(user, done) {
      done(null, user.id);
    });
    passport.deserializeUser(function(id, done) {
      UserModel.findById(id, function(err, user) {
        done(err, user);
      });
    });
    passport.use('bearer', new BearerStrategy(function(token, done) {
      return UserModel.findOne({
        token: token
      }, function(err, user) {
        if (err != null) {
          return done(err);
        }
        if (!user) {
          return done(null, false);
        }
        user.is = function(check) {
          return check === this.permissionLevel;
        };
        return done(null, user, {
          scope: 'all'
        });
      });
    }));
    saveUser = function(user, callback) {
      return user.save(function(err, user) {
        if (err != null) {
          return callback(err);
        }
        return callback(null, user);
      });
    };
    passport.use('local-signup', new LocalStrategy({
      usernameField: 'invitationCode',
      passwordField: 'password',
      passReqToCallback: true
    }, function(req, invitationCode, password, done) {
      return process.nextTick(function() {
        return UserModel.findOne({
          '_id': new ObjectId(invitationCode),
          'active': false
        }, function(err, user) {
          if (err != null) {
            return done(err);
          }
          if (user != null) {
            user.password = new UserModel().generateHash(password);
            user.vitabookPassword = new UserModel().generateVitabookPassword(password);
            user.active = true;
            return saveUser(user, function(err, user) {
              if (err != null) {
                return done(err, false);
              }
              return done(null, user);
            });
          } else {
            console.log('invitationCode ungültig oder bereits verwendet');
            return done('invitationCode ungültig oder bereits verwendet');
          }
        });
      });
    }));
    passport.use('local-login', new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true
    }, function(req, email, password, done) {
      UserModel.findOne({
        'email': email,
        'active': true
      }, function(err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          console.log('Emailadresse unbekannt');
          return done(null, false, {
            message: 'Emailadresse unbekannt'
          });
        }
        if (!user.validPassword(password)) {
          console.log('Passwort nicht korrekt');
          return done(null, false, {
            message: 'Passwort nicht korrekt'
          });
        }
        return done(null, user);
      });
    }));
  };

}).call(this);
