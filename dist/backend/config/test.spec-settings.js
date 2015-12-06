(function() {
  var ObjectId, applicationDir, environment, mongoose;

  environment = 'test';

  applicationDir = '../../.tmp/serve/';

  mongoose = require('mongoose');

  ObjectId = mongoose.Types.ObjectId;

  exports.connectDB = function() {
    var configDB, db;
    configDB = require(applicationDir + 'backend/config/database.js')(environment);
    if (mongoose.connection.readyState === 0) {
      mongoose.connect(configDB.url, {
        auth: {
          authdb: configDB.authdb
        }
      }, function(err) {
        if (err) {
          return console.log(err);
        }
      });
      db = mongoose.connection;
      db.on('error', console.error.bind(console, 'connection error:'));
      return db.once('open', function() {
        return db;
      });
    } else {
      db = mongoose.connection;
      return db;
    }
  };

  exports.getTestDummies = function() {
    var testConfig;
    return testConfig = {
      'SUPERADMIN_ID': new ObjectId('55a7645de07f6a835badb81a'),
      'NATIONAL_ID': new ObjectId('55ae0fa3c4f1838b6609145b'),
      'NATIONALFIELD_ID': new ObjectId('55ae0fa4c4f1838b6609145d'),
      'INSTITUTE_ID': new ObjectId('55ae0fa4c4f1838b66091461'),
      'INSTITUTE_B_ID': new ObjectId('55ae0fa4c4f1838b66091313'),
      'INSTITUTEEX_ID': new ObjectId('55ae0fa4c4f1838b66091467'),
      'EMPLOYEE_ID': new ObjectId('55ae0fa4c4f1838b66091464'),
      'EMPLOYEE_AUTO_ID': new ObjectId('55ae0fa4c4f1838466091464'),
      'PATIENT_ID': new ObjectId('55ae0fa4c4f1838b66091466'),
      'FAKE_ID': new ObjectId('111111111111111111111111'),
      'DUMMYINSTITUTE1': new ObjectId('55a76190bcdb4a82585c8e9d'),
      'DUMMYINSTITUTE2': new ObjectId('55a76190bcdb4a82585c8e91'),
      'DUMMYINSTITUTE3': new ObjectId('55a761222cdb4a82585c8e91'),
      'DUMMYINSTITUTE4': new ObjectId('55a76190bcdb4a82585c8e2f'),
      'DUMMYPATIENT1': new ObjectId('55b8c16f014a716880b1404a'),
      'DUMMYPATIENT2': new ObjectId('55b8c16f014a716880b1404c'),
      'DUMMYPATIENT3': new ObjectId('55b8c16f014a716812b1404c'),
      'DUMMYPATIENT2INSTITUTE': new ObjectId('55a76190bcdb4a82585c1111'),
      'DUMMYOPERATION1': '1234',
      'DUMMYIMPLANT1': new ObjectId('55b8c16f014a716880b1404b'),
      'DUMMYIMPLANT2': new ObjectId('55b8c16f1111716880b1404b'),
      'DUMMYIMPLANT3': new ObjectId('55b8c16f4444716880b1404b'),
      'DUMMYIMPLANTBASEDATA': new ObjectId('55b8c16f014a716880b14019'),
      'DUMMYIMPLANTBASEDATAFAKE': new ObjectId('55b8c16f014a716870b14019'),
      'DUMMYIMPLANTBASEDATA_REFERENCENR': '111AAA',
      hl7: {
        expectedACK: /^\vMSH\|\^~\\&\|Implantatmanager\|01\|Charite\|55a76190bcdb4a82585c8e9d\|\d*\|\|ACK\^T01\^MDM_T01\|ACK0\|P\|2\.5\.1\r\nMSA\|AA\|64322\|\|\r\n\r\n/,
        parsedMessage: {
          segments: [
            {
              parsed: {
                SegmentType: 'MSH',
                SendingApplication: 'Charite',
                SendingFacility: '55a76190bcdb4a82585c8e9d',
                ReceivingApplication: 'Implantatmanager',
                ReceivingFacility: '01',
                MessageControlID: '64322',
                MessageType: 'MDM^T01^MDM_T01',
                VersionID: '2.5.1'
              }
            }, {
              parsed: {
                SegmentType: 'PID',
                PatientID: '103456',
                DateOfBirth: '19850510',
                PatientName: 'Geissinger^Andreas^^',
                Sex: 'M',
                Address: 'St Anna Str 12^^München^^80538^Deutschland',
                PhoneNumberHome: '08912196611^^^a.geissinger@gmx.de'
              }
            }, {
              parsed: {
                SegmentType: 'IN1',
                InsuranceCompanyID: '123456789',
                InsuredsIDNumber: '12345'
              }
            }, {
              parsed: {
                SegmentType: 'STF',
                StaffIDCode: '55ae0fa4c4f1838b66091464'
              }
            }
          ]
        }
      }
    };
  };

}).call(this);
