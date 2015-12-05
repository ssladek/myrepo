(function() {
  var ObjectId, UserModel, apiSenderService, async, configDB, deleteUser, environment, getUserFilter, nodemailerService, saveUser, self, sendInvitationLink, updateLogService, updateUser;

  async = require('async');

  self = this;

  nodemailerService = require('../mailer/nodemailer.service.js');

  apiSenderService = require('../api/manager/api-sender.service.js');

  updateLogService = require('../log/update/update-log.service.js');

  environment = require('../config/config.js')();

  configDB = require('../config/database.js')(environment);

  UserModel = require('./user.model.js');

  ObjectId = require('mongoose').Types.ObjectId;

  exports.transferUsersToNationalRegister = function(appUser, lastUpdated, callback) {
    var appUserToken, filter, startDate;
    appUserToken = appUser.token;
    startDate = lastUpdated;
    filter = {};
    if (startDate !== 'none') {
      filter = {
        "$or": [
          {
            "lastSyncedManager": {
              "$gt": startDate
            },
            "lastSyncedManager": null
          }
        ]
      };
    }
    filter.permissionLevel = {
      $in: ["institute", "employee", "patient"]
    };
    return UserModel.find(filter).lean().exec(function(err, usersFound) {
      if (err != null) {
        return callback(err);
      }
      if ((usersFound != null) && usersFound.length > 0) {
        return apiSenderService.send(environment, 'createOrUpdateUsers', usersFound, appUserToken, function(err, userIds) {
          if (err != null) {
            return callback(err);
          }
          return async.each(userIds, function(userId, next) {
            return UserModel.update({
              _id: new Object(userId._id)
            }, {
              $set: {
                refId: new Object(userId.refId),
                lastSyncedManager: new Date()
              }
            }, function(err, result) {
              if (err != null) {
                return next(err);
              }
              return next(null);
            });
          }, function(err) {
            if (err != null) {
              return callback(err);
            }
            return updateLogService.createLog(appUser, 'local', 'national', 'users', true, function(err, result) {
              if (err != null) {
                return callback(err);
              }
              return callback(null, true);
            });
          });
        });
      } else {
        return updateLogService.createLog(appUser, 'local', 'national', 'users', true, function(err, result) {
          if (err != null) {
            return callback(err);
          }
          return callback(null, 'nothing to transfer');
        });
      }
    });
  };

  saveUser = function(user, callback) {
    return user.save(function(err) {
      if (err != null) {
        if (err.code === 11000) {
          return callback('Emailadresse ist bereits registriert');
        }
        return callback(err);
      }
      if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development') {
        return sendInvitationLink(user._id, user.email, user.gender, user.lastName, callback);
      } else {
        return callback(null, user._id);
      }
    });
  };

  updateUser = function(user, callback) {
    return user.save(function(err) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, user);
    });
  };

  deleteUser = function(user, callback) {
    user.deleted = true;
    return user.save(function(err) {
      if (err != null) {
        return callback(err);
      }
      return callback(null, true);
    });
  };

  sendInvitationLink = function(userId, email, gender, lastName, callback) {
    var emailHtml, emailPlain, htmlText, linkBaseHtml, linkBasePlain, linkFullHtml, linkFullPlain, plainText, subject, url;
    url = require('../helper/helper.service.js').getIp();
    linkBaseHtml = "<a href=\"" + url + "#/signup/\" title=\"Anmelden\">" + url + "#/signup/</a>";
    linkFullHtml = "<a href=\"" + url + "#/signup/\" title=\"Anmelden\">" + url + "#/signup/" + userId + "</a>";
    emailHtml = '<a href="mailto:support@ordermed.com">support@ordermed.com</a>';
    linkBasePlain = url + "#/signup/";
    linkFullPlain = url + "#/signup/" + userId;
    emailPlain = 'support@ordermed.com';
    subject = 'Anmeldung Implantatregister';
    plainText = "Hallo " + gender + " " + lastName + ",\r\n\r\n";
    plainText += "Ihre Zugangsdaten zu Implantatregister, nach Anklicken des Links können Sie Ihr Passwort festlegen: :\r\nLINKFULL\r\n\r\n";
    plainText += "Falls der Link nicht richtig von Ihrem Emailprogramm erkannt wird, öffnen Sie bitte:\r\nLINKBASE\r\n" + ("und kopieren den folgenden 24-stelligen Code per Hand in das dort angezeigte Feld:\r\n" + userId + "\r\n\r\n");
    plainText += "Bei Rückfragen zum Registrierungsprozess:\r\n04181-9289099\r\nEMAIL\r\n\r\n";
    plainText += "Vielen Dank für Ihre Registrierung,\r\nIhr ordermed-Support Team";
    htmlText = plainText.replace(/\r\n/g, "<br/>").replace("LINKFULL", linkFullHtml).replace("LINKBASE", linkBaseHtml).replace("EMAIL", emailHtml);
    plainText = plainText.replace("LINKFULL", linkFullPlain).replace("LINKBASE", linkBasePlain).replace("EMAIL", emailPlain);
    return nodemailerService(environment, email, subject, plainText, htmlText, function(err, validated) {
      if (err) {
        return callback(err);
      }
      return callback(err, userId);
    });
  };

  exports.createUser = function(appUser, userData, callback) {
    var err, newUser;
    err = "";
    newUser = new UserModel();
    if (userData.vitabookId != null) {
      newUser.vitabookId = userData.vitabookId;
    }
    if (userData.gender != null) {
      newUser.gender = userData.gender;
    }
    if (userData.lastName != null) {
      newUser.lastName = userData.lastName;
    } else {
      err += "Kein Nachname angegeben.";
    }
    if (userData.firstName != null) {
      newUser.firstName = userData.firstName;
    }
    if (userData.permissionLevel != null) {
      newUser.permissionLevel = userData.permissionLevel;
    } else {
      err += "Kein Berechtigungslevel angegeben.";
    }
    if (userData.field != null) {
      newUser.field = userData.field;
    }
    if (userData.telephone != null) {
      newUser.telephone = userData.telephone;
    }
    if (userData.mobile != null) {
      newUser.mobile = userData.mobile;
    }
    if (userData.email != null) {
      newUser.email = userData.email;
    }
    if (userData.street != null) {
      newUser.street = userData.street;
    }
    if (userData.zipcode != null) {
      newUser.zipcode = userData.zipcode;
    }
    if (userData.city != null) {
      newUser.city = userData.city;
    }
    if (err !== "") {
      return callback(err);
    } else {
      err = null;
    }
    if (appUser.is('superAdmin')) {
      if (userData.institute) {
        newUser.institute = new ObjectId(userData.institute);
      } else {
        return callback('Kein Zurodnung zu einer Klinik');
      }
    } else if (appUser.is('national')) {
      if (userData.institute) {
        newUser.institute = new ObjectId(userData.institute);
      } else {
        return callback('Kein Zurodnung zu einer Klinik');
      }
      if (newUser.permissionLevel !== 'national') {
        return callback('Keine Berechtigung zum Erstellen dieser Rechtegruppen');
      }
    } else if (appUser.is('nationalField')) {
      newUser.field = appUser.field;
      if (userData.institute) {
        newUser.institute = new ObjectId(userData.institute);
      } else {
        return callback('Kein Zurodnung zu einer Klinik');
      }
      if (newUser.permissionLevel !== 'nationalField') {
        return callback('Keine Berechtigung zum Erstellen dieser Rechtegruppen');
      }
    } else if (appUser.is('institute')) {
      newUser.institute = new ObjectId(appUser.institute);
      if (newUser.permissionLevel !== 'institute' && newUser.permissionLevel !== 'employee' && newUser.permissionLevel !== 'employee-auto' && newUser.permissionLevel !== 'patient') {
        return callback('Keine Berechtigung zum Erstellen dieser Rechtegruppen');
      }
    } else if (appUser.is('employee')) {
      newUser.field = appUser.field;
      newUser.institute = new ObjectId(appUser.institute);
      if (newUser.permissionLevel !== 'patient') {
        return callback('Keine Berechtigung zum Erstellen dieser Rechtegruppen');
      }
    } else {
      return callback('Keine Berechtigung zum Erstellen dieser Rechtegruppen');
    }
    return saveUser(newUser, callback);
  };

  exports.getUserDetail = function(userId, select, callback) {
    return UserModel.findOne({
      _id: new ObjectId(userId),
      deleted: false
    }).select(select).exec(function(err, detail) {
      if (err != null) {
        return callback(err);
      }
      if (err == null) {
        err = null;
      }
      return callback(null, detail);
    });
  };

  getUserFilter = function(appUser, filter, callbackGetUsers) {
    if (appUser.is('superAdmin')) {

    } else if (appUser.is('national')) {
      filter.permissionLevel = appUser.permissionLevel;
    } else if (appUser.is('nationalField')) {
      filter.field = appUser.field;
      filter.permissionLevel = appUser.permissionLevel;
    } else if (appUser.is('institute')) {
      filter.institute = appUser.institute;
    } else if (appUser.is('employee')) {
      filter.field = appUser.field;
      filter.institute = appUser.institute;
      filter._id = appUser._id;
    } else if (appUser.is('patient')) {
      filter._id = appUser._id;
      filter.field = appUser.field;
      filter.institute = appUser.institute;
    } else {
      return callbackGetUsers('Keine Berechtigung zum Lesen der User');
    }
    filter.deleted = false;
    return callbackGetUsers(null, filter);
  };

  exports.getUserForHl7 = function(userId, callback) {
    return UserModel.findOne({
      _id: new ObjectId(userId),
      deleted: false
    }).select({
      permissionLevel: 1,
      field: 1,
      institute: 1,
      token: 1
    }).exec(function(err, hl7User) {
      if (err != null) {
        return callback(err);
      }
      if (hl7User == null) {
        return callback("Mitarbeiter mit ID: " + userId + " nicht vorhanden");
      }
      if (err == null) {
        err = null;
      }
      return callback(err, hl7User);
    });
  };

  exports.getUsers = function(appUser, filter, selector, limit, callback) {
    if (filter == null) {
      filter = {};
    }
    filter.deleted = false;
    if (limit == null) {
      limit = 0;
    }
    if ((selector == null) || selector === {}) {
      selector = {
        password: 0,
        vitabookPassword: 0,
        token: 0
      };
    }
    return getUserFilter(appUser, filter, function(err, newFilter) {
      if (err != null) {
        return callback(err);
      }
      return UserModel.find(newFilter).select(selector).limit(limit).populate('institute', {
        eprdClientNr: 0,
        eprdClientLizenz: 0,
        initialKey: 0
      }).sort({
        lastName: -1
      }).exec(function(err, usersFound) {
        if (err != null) {
          return callback(err);
        }
        if (err == null) {
          err = null;
        }
        return callback(err, usersFound);
      });
    });
  };

  exports.getCoWorkers = function(appUser, callback) {
    var selector;
    if ((typeof selector === "undefined" || selector === null) || selector === {}) {
      selector = {
        password: 0,
        vitabookPassword: 0,
        token: 0
      };
    }
    return getUserFilter(appUser, {
      permissionLevel: 'employee'
    }, function(err, newFilter) {
      if (err != null) {
        return callback(err);
      }
      return UserModel.find(newFilter).select({
        _id: 1,
        firstName: 1,
        lastName: 1,
        field: 1,
        institute: 1
      }).sort({
        lastName: -1
      }).populate('institute', 'name').exec(function(err, usersFound) {
        if (err != null) {
          return callback(err);
        }
        if (err == null) {
          err = null;
        }
        return callback(err, usersFound);
      });
    });
  };

  exports.updateUser = function(appUser, updateData, callback) {
    var permissionEmployee, permissionEmployeeAuto, permissionInstitute, permissionNational, permissionNationalField, permissionPatient, permissionSuperAdmin;
    permissionSuperAdmin = ['superAdmin', 'national', 'nationalField', 'institute', 'employee', 'patient'];
    permissionNational = ['national'];
    permissionNationalField = ['nationalField'];
    permissionInstitute = ['institute', 'employee', 'patient'];
    permissionEmployee = ['employee', 'patient'];
    permissionEmployeeAuto = ['employee-auto'];
    permissionPatient = ['patient'];
    return UserModel.findOne({
      _id: new ObjectId(updateData._id),
      deleted: false
    }).populate('institute', {
      eprdClientNr: 0,
      eprdClientLizenz: 0,
      initialKey: 0
    }).exec(function(err, user) {
      var permissionArray, ref;
      if (err) {
        callback(err);
      }
      if (user == null) {
        return callback('kein Benutzer mit der ID gefunden');
      }
      if (appUser.is('superAdmin')) {
        permissionArray = permissionSuperAdmin;
        if (!permissionArray.some(function(permission) {
          return permission === user.permissionLevel;
        })) {
          return callback('keine Berechtigung zum Editieren des Benutzers');
        }
      } else if (appUser.is('national')) {
        permissionArray = permissionNational;
        if (appUser._id.toString() !== user._id.toString()) {
          return callback('Sie können nur sich selbst editieren');
        }
      } else if (appUser.is('nationalField')) {
        permissionArray = permissionNationalField;
        if (appUser._id.toString() !== user._id.toString()) {
          return callback('Sie können nur sich selbst editieren');
        }
      } else if (appUser.is('institute')) {
        permissionArray = permissionInstitute;
        if (!permissionArray.some(function(permission) {
          return permission === user.permissionLevel;
        })) {
          return callback('keine Berechtigung zum Editieren des Benutzers');
        }
        if ((((ref = user.institute) != null ? ref._id : void 0) == null) || user.institute._id.toString() !== appUser.institute.toString()) {
          return callback('Es können nur Benutzer der eigenen Klinik editiert werden');
        }
      } else if (appUser.is('employee')) {
        permissionArray = permissionEmployee;
        if (!permissionArray.some(function(permission) {
          return permission === user.permissionLevel;
        })) {
          return callback('keine Berechtigung zum Editieren des Benutzers');
        }
        if (user.permissionLevel === 'employee' && (appUser._id.toString() !== user._id.toString())) {
          return callback('Sie können nur sich selbst oder Patienten editieren');
        }
        if ((user.institute == null) || user.institute._id.toString() !== appUser.institute.toString()) {
          return callback('Es können nur Patienten der eigenen Klinik editiert werden');
        }
        if ((updateData.field != null) && (user.field !== updateData.field)) {
          return callback('Sie haben nicht die Berechtigung die Fachrichtung zu ändern');
        }
      } else if (appUser.is('employee-auto')) {
        permissionArray = permissionEmployeeAuto;
        if (appUser._id.toString() !== user._id.toString()) {
          return callback('Sie können nur sich selbst editieren');
        }
      } else if (appUser.is('patient')) {
        permissionArray = permissionPatient;
        if (appUser._id.toString() !== user._id.toString()) {
          return callback('Sie können nur sich selbst editieren');
        }
      } else {
        return callback('keine Berechtigung zum Editieren des Benutzers');
      }
      if (updateData.gender != null) {
        user.gender = updateData.gender;
      }
      if (updateData.lastName != null) {
        user.lastName = updateData.lastName;
      }
      if (updateData.firstName != null) {
        user.firstName = updateData.firstName;
      }
      if (updateData.field != null) {
        user.field = updateData.field;
      }
      if (updateData.telephone != null) {
        user.telephone = updateData.telephone;
      }
      if (updateData.mobile != null) {
        user.mobile = updateData.mobile;
      }
      if (updateData.street != null) {
        user.street = updateData.street;
      }
      if (updateData.zipcode != null) {
        user.zipcode = updateData.zipcode;
      }
      if (updateData.city != null) {
        user.city = updateData.city;
      }
      user.lastUpdated = new Date().toISOString();
      if (permissionArray.some(function(permission) {
        return permission === updateData.permissionLevel;
      }) && user._id.toString() !== appUser._id.toString()) {
        user.permissionLevel = updateData.permissionLevel;
      }
      if (updateData.password != null) {
        return UserModel.findOne({
          _id: new ObjectId(appUser._id),
          deleted: false
        }, function(err, foundAppUser) {
          if (err != null) {
            return callback(err);
          }
          if ((updateData.ownPassword != null) && foundAppUser.validPassword(updateData.ownPassword)) {
            user.password = new UserModel().generateHash(updateData.password);
            user.active = true;
            return updateUser(user, callback);
          } else {
            return callback('Bitte überprüfen Sie ihr Passwort');
          }
        });
      } else {
        return updateUser(user, callback);
      }
    });
  };

  exports.deleteUser = function(appUser, userId, callback) {
    var permissionEmployee, permissionInstitute, permissionNational, permissionNationalField, permissionSuperAdmin;
    permissionSuperAdmin = ['national', 'nationalField', 'institute', 'employee', 'patient'];
    permissionNational = ['national', 'nationalField', 'institute', 'employee', 'patient'];
    permissionNationalField = ['nationalField', 'institute', 'employee', 'patient'];
    permissionInstitute = ['institute', 'employee', 'patient'];
    permissionEmployee = ['employee', 'patient'];
    return UserModel.findOne({
      _id: new ObjectId(userId),
      deleted: false
    }).populate('institute', {
      eprdClientNr: 0,
      eprdClientLizenz: 0,
      initialKey: 0
    }).exec(function(err, user) {
      var ref, ref1;
      if (err) {
        return callback(err);
      }
      if (err == null) {
        err = null;
      }
      if (user == null) {
        return callback('kein Benutzer mit der ID gefunden' + userId);
      }
      if (appUser.is('superAdmin')) {
        if (!permissionSuperAdmin.some(function(permission) {
          return permission === user.permissionLevel;
        })) {
          return callback('keine Berechtigung zum Löschen des Benutzers');
        }
      } else if (appUser.is('national')) {
        if (!permissionNational.some(function(permission) {
          return permission === user.permissionLevel;
        })) {
          return callback('keine Berechtigung zum Löschen des Benutzers');
        }
      } else if (appUser.is('nationalField')) {
        if (!permissionNationalField.some(function(permission) {
          return permission === user.permissionLevel;
        })) {
          return callback('keine Berechtigung zum Löschen des Benutzers');
        }
        if ((user.field == null) || user.field !== appUser.field) {
          return callback('Es können nur Benutzer im eigenen Fachbereich gelöscht werden');
        }
      } else if (appUser.is('institute')) {
        if (!permissionInstitute.some(function(permission) {
          return permission === user.permissionLevel;
        })) {
          return callback('keine Berechtigung zum Löschen des Benutzers');
        }
        if ((((ref = user.institute) != null ? ref._id : void 0) == null) || user.institute._id.toString() !== appUser.institute.toString()) {
          return callback('Es können nur Benutzer der eigenen Klinik gelöscht werden');
        }
      } else if (appUser.is('employee')) {
        if (!permissionEmployee.some(function(permission) {
          return permission === user.permissionLevel;
        })) {
          return callback('keine Berechtigung zum Löschen des Benutzers');
        }
        if (user.permissionLevel !== 'patient' && ((user.field == null) || user.field !== appUser.field)) {
          return callback('Es können nur Mitarbeiter im eigenen Fachbereich oder Patienten gelöscht werden');
        }
        if ((((ref1 = user.institute) != null ? ref1._id : void 0) == null) || user.institute._id.toString() !== appUser.institute.toString()) {
          return callback('Es können nur Benutzer der eigenen Klinik gelöscht werden');
        }
      } else if (appUser.is('patient')) {
        if (appUser._id.toString() !== user._id.toString()) {
          return callback('Sie können nur sich selbst löschen');
        }
      } else {
        return callback('keine Berechtigung zum Löschen des Benutzers');
      }
      if ((user.institute != null) && user._id.toString() === user.institute.responsiblePerson.toString()) {
        return callback('Klinikeigentümer können nicht gelöscht werden, legen Sie zuerst eine andere verantwortliche Person fest!');
      }
      return deleteUser(user, callback);
    });
  };

}).call(this);
