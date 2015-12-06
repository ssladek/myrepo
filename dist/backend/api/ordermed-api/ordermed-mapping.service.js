(function() {
  var InstituteModel, ObjectId, UserModel, async, inspect, instituteService, saveUsers, self, userService;

  async = require('async');

  inspect = require('eyespect').inspector({
    maxLength: null
  });

  UserModel = require('../../user/user.model.js');

  InstituteModel = require('../../institute/institute.model.js');

  ObjectId = require('mongoose').Types.ObjectId;

  instituteService = require('../../institute/institute.service.js');

  userService = require('../../user/user.service.js');

  self = this;

  saveUsers = function(appUser, instituteId, users, callback) {
    return async.each(users, function(userData, next) {
      userData.institute = instituteId.toString();
      return UserModel.findOne({
        vitabookId: userData.vitabookId
      }, function(err, result) {
        if (err != null) {
          return next(err);
        }
        if (result === null) {
          return userService.createUser(appUser, userData, next);
        }
        return next(null, true);
      });
    }, function(err) {
      if (err != null) {
        console.log('err (save User ordermed api)', err);
      }
      if (err != null) {
        return callback(err);
      }
      console.log('(save User ordermed api) success');
      return callback(null, true);
    });
  };

  exports.saveInstituteAndUsers = function(appUser, instituteAndUsers, callback) {
    var ref;
    if (((ref = instituteAndUsers.institute) != null ? ref.vitabookId : void 0) != null) {
      return InstituteModel.findOne({
        vitabookId: instituteAndUsers.institute.vitabookId
      }, function(err, instituteFound) {
        if (err != null) {
          return callback(err);
        }
        if (instituteFound !== null) {
          console.log('exists');
          return saveUsers(appUser, instituteFound._id, instituteAndUsers.users, callback);
        } else {
          console.log('exists not');
          return instituteService.createInstitute(appUser, instituteAndUsers.institute, function(err, instituteId) {
            if (err != null) {
              return callback(err);
            }
            if (instituteId == null) {
              return callback('Klinik konnte nicht gespeichert werden');
            }
            return saveUsers(appUser, instituteId, instituteAndUsers.users, callback);
          });
        }
      });
    }
  };

  exports.mapOrdermedInstituteAndPerson = function(instituteAndPerson) {
    var i, index, len, myInstitute, myUser, myUsers, person, persons;
    myInstitute = {};
    myUsers = [];
    if (instituteAndPerson.ID != null) {
      myInstitute.vitabookId = instituteAndPerson.ID;
    }
    if (instituteAndPerson.Name != null) {
      myInstitute.name = instituteAndPerson.Name;
    }
    if (instituteAndPerson.Zip != null) {
      myInstitute.zipcode = instituteAndPerson.Zip;
    }
    if (instituteAndPerson.Address != null) {
      myInstitute.street = instituteAndPerson.Address;
    }
    if (instituteAndPerson.City != null) {
      myInstitute.city = instituteAndPerson.City;
    }
    if (instituteAndPerson.Phone != null) {
      myInstitute.telephone = instituteAndPerson.Phone;
    }
    if (instituteAndPerson.Fax != null) {
      myInstitute.fax = instituteAndPerson.Fax;
    }
    if (instituteAndPerson.Email != null) {
      myInstitute.email = instituteAndPerson.Email;
    }
    if (instituteAndPerson.Website != null) {
      myInstitute.website = instituteAndPerson.Website;
    }
    if (instituteAndPerson.Lastmodified != null) {
      myInstitute.lastUpdate = instituteAndPerson.Lastmodified;
    }
    if (instituteAndPerson.BaseUrl != null) {
      myInstitute.baseUrl = instituteAndPerson.BaseUrl;
    }
    myInstitute.baseUrl = 'http://localhost:80' + '80/';
    if (instituteAndPerson.Partner != null) {
      persons = instituteAndPerson.Partner;
      for (index = i = 0, len = persons.length; i < len; index = ++i) {
        person = persons[index];
        myUser = {};
        if (person.ID != null) {
          myUser.vitabookId = person.ID;
        }
        if (index === 0) {
          myUser.permissionLevel = 'institute';
        } else {
          myUser.permissionLevel = 'employee';
        }
        if (person.Titel != null) {
          myUser.gender = person.Titel;
        }
        if (person.Lastname != null) {
          myUser.lastName = person.Lastname;
        }
        if (person.Firstname != null) {
          myUser.firstName = person.Firstname;
        }
        if (person.Email != null) {
          myUser.email = person.Email;
        }
        if (person.Lastmodified != null) {
          myUser.lastUpdate = person.Lastmodified;
        }
        myUsers.push(myUser);
      }
    }
    return {
      'institute': myInstitute,
      'users': myUsers
    };
  };

  exports.mapPatientToOrdermedPatient = function(patient, callback) {
    var ordermedPatient;
    ordermedPatient = {};
    return InstituteModel.findOne({
      _id: patient.institute
    }, function(err, institute) {
      var AddressItemWS;
      if (err != null) {
        return callback(err);
      }
      if (institute === null) {
        return callback("Keine Klinik vorhanden");
      }
      if (patient.vitabookId != null) {
        ordermedPatient["ID"] = patient.vitabookId;
      }
      if (patient.gender != null) {
        ordermedPatient["Salutation"] = patient.gender;
      }
      if (patient.firstName != null) {
        ordermedPatient["Firstname"] = patient.firstName;
      }
      if (patient.lastName != null) {
        ordermedPatient["Lastname"] = patient.lastName;
      }
      if (patient.email != null) {
        ordermedPatient["Email"] = patient.email;
      }
      if (patient.firstName != null) {
        ordermedPatient["Phone"] = patient.firstName;
      }
      if (institute.vitabookId != null) {
        ordermedPatient["CompanyID"] = parseInt(institute.vitabookId);
      }
      ordermedPatient["Addresses"] = [];
      AddressItemWS = {};
      AddressItemWS["Label"] = "Standard";
      if (patient.street != null) {
        AddressItemWS["Address"] = patient.street;
      }
      if (patient.zipcode != null) {
        AddressItemWS["Zip"] = patient.zipcode.toString();
      }
      if (patient.city != null) {
        AddressItemWS["City"] = patient.city;
      }
      ordermedPatient['Addresses'].push(AddressItemWS);
      return callback(null, ordermedPatient);
    });
  };

  exports.mapUserToOrdermedDoctor = function(user, callback) {
    var ordermedDoctor;
    ordermedDoctor = {};
    return InstituteModel.findOne({
      _id: user.institute
    }, function(err, institute) {
      var PersonItemWS;
      if (err != null) {
        return callback(err);
      }
      if (institute === null) {
        return callback("Keine Klinik vorhanden");
      }
      console.log("institute", institute);
      if (user.vitabookId != null) {
        ordermedDoctor["ID"] = user.vitabookId;
      }
      if (user.firstName != null) {
        ordermedDoctor['Name'] = user.firstName;
      }
      if (user.lastName != null) {
        if (ordermedDoctor['Name'] == null) {
          ordermedDoctor['Name'] = '';
        } else {
          ordermedDoctor['Name'] += ' ';
        }
        ordermedDoctor['Name'] += user.lastName;
      }
      if (user.zipcode != null) {
        ordermedDoctor['Zip'] = user.zipcode;
      }
      if (user.street != null) {
        ordermedDoctor['Address'] = user.street;
      }
      if (user.city != null) {
        ordermedDoctor['City'] = user.city;
      }
      if (user.telephone != null) {
        ordermedDoctor['Phone'] = user.telephone;
      }
      if (user.fax != null) {
        ordermedDoctor['Fax'] = user.fax;
      }
      if (user.email != null) {
        ordermedDoctor['Email'] = user.email;
      }
      if (institute.vitabookId != null) {
        ordermedDoctor['ClinicID'] = parseInt(institute.vitabookId);
      }
      ordermedDoctor['Partner'] = [];
      PersonItemWS = {};
      if (user.gender != null) {
        PersonItemWS['Salutation'] = user.gender;
      }
      if (user.firstName != null) {
        PersonItemWS['Firstname'] = user.firstName;
      }
      if (user.lastName != null) {
        PersonItemWS['Lastname'] = user.lastName;
      }
      if (user.email != null) {
        PersonItemWS['Email'] = user.email;
      }
      if (user.vitabookPassword != null) {
        PersonItemWS['Password'] = user.vitabookPassword;
      }
      ordermedDoctor['Partner'].push(PersonItemWS);
      return callback(null, ordermedDoctor);
    });
  };

  exports.mapTreatmentToOrdermedTreatment = function(treatment, callback) {
    var ordermedTreatment;
    ordermedTreatment = {};
    if (treatment.operationName != null) {
      ordermedTreatment['Description'] = treatment.operationName;
    } else {
      return callback("Treatment hat keinen OP-Namen");
    }
    if ((treatment.creator != null) && (treatment.creator.vitabookId != null)) {
      ordermedTreatment['PersonID'] = treatment.creator.vitabookId;
    } else {
      return callback("Treatment hat keinen Operateur mit VitabookId");
    }
    if ((treatment.implants != null) && treatment.implants.length > 0) {
      ordermedTreatment['Implants'] = treatment.implants;
    } else {
      return callback("Treatment hat keine Implantate");
    }
    inspect(ordermedTreatment);
    console.log("ORDERMED TREATMENT eof -----------------");
    return callback(null, ordermedTreatment);
  };

}).call(this);
