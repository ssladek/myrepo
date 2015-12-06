(function() {
  var Parser, answerMessageIdCounter, checkSegmentExists, clients, createClient, hl7, hl7Date, net, patientService, portHl7, replaceStream, self, socketIoMessenger, split, stream, userService;

  net = require('net');

  hl7 = require('nodengine-hl7');

  split = require('split');

  stream = require('stream');

  replaceStream = require('replacestream');

  portHl7 = process.env.PORT_HL7 || 444;

  socketIoMessenger = require('../../socket-io/socket-io-messenger.js');

  userService = require('../../user/user.service.js');

  patientService = require('../../patient/patient.service.js');

  self = this;

  Parser = hl7.Parser;

  clients = [];

  answerMessageIdCounter = 0;

  hl7Date = function() {
    return new Date().toISOString().slice(0, 16).replace(/-|:|T/g, "");
  };

  exports.sendAcknowlegmentMessage = function(message, accept, err, client) {
    var answerMessageId, i, len, messageAccepted, messageCode, messageControllId, messageType, msa, msh, receivingApplication, receivingFacility, ref, returnMessage, segment, sendingApplication, sendingFacility, versionID;
    receivingApplication = '';
    receivingFacility = '';
    if (message.segments != null) {
      ref = message.segments;
      for (i = 0, len = ref.length; i < len; i++) {
        segment = ref[i];
        if (segment.parsed.ReceivingApplication != null) {
          sendingApplication = segment.parsed.ReceivingApplication;
        }
        if (segment.parsed.ReceivingFacility != null) {
          sendingFacility = segment.parsed.ReceivingFacility;
        }
        if (segment.parsed.SendingApplication != null) {
          receivingApplication = segment.parsed.SendingApplication;
        }
        if (segment.parsed.SendingFacility != null) {
          receivingFacility = segment.parsed.SendingFacility;
        }
        if (segment.parsed.MessageType != null) {
          messageType = segment.parsed.MessageType.split('^').splice(1).join('^');
          if (messageType.length > 0) {
            messageType = '^' + messageType;
          }
        }
        if (segment.parsed.MessageControlID != null) {
          messageControllId = segment.parsed.MessageControlID;
        }
        if (segment.parsed.VersionID != null) {
          versionID = segment.parsed.VersionID;
        }
      }
    }
    if (accept === true) {
      messageAccepted = 'AA';
      messageCode = '0';
    } else {
      messageAccepted = 'AR';
      messageCode = '101';
    }
    answerMessageId = 'ACK' + answerMessageIdCounter;
    answerMessageIdCounter++;
    msh = 'MSH|^~\\&|' + sendingApplication + '|' + sendingFacility + '|' + receivingApplication + '|' + receivingFacility + '|' + hl7Date() + '||ACK' + messageType + '|' + answerMessageId + '|P|' + versionID + '\r\n';
    msa = 'MSA|' + messageAccepted + '|' + messageControllId + '|' + err + '|' + '\r\n';
    returnMessage = '\v' + msh + msa + '\r\n';
    console.log(returnMessage);
    client.write(returnMessage);
    return client.end();
  };

  exports.createServer = function(io) {
    var server;
    console.log("hl7 listening on port " + portHl7);
    server = net.createServer({
      allowHalfOpen: true,
      pauseOnConnect: false
    }, function(socket) {
      return createClient(socket, io);
    });
    server.listen(portHl7);
    server.on('error', function(err) {
      if (err.code === 'EADDRINUSE') {
        console.log('Address in use, retrying...');
        return setTimeout(function() {
          server.close();
          return self.createServer();
        }, 1000);
      }
    });
    return server.on('close', function(err) {
      return console.log("server closed");
    });
  };

  checkSegmentExists = function(message, checkSegment) {
    return message.segments.some(function(segment) {
      return segment.parsed.SegmentType === checkSegment;
    });
  };

  exports.readMessage = function(message, callback) {
    var address, communication, err, i, len, name, patient, ref, segment;
    err = '';
    if (!checkSegmentExists(message, 'MSH')) {
      err += 'No MSH segment';
    }
    if (!checkSegmentExists(message, 'PID')) {
      err += 'No PID segment';
    }
    if (!checkSegmentExists(message, 'IN1')) {
      err += 'No IN1 segment';
    }
    if (!checkSegmentExists(message, 'STF')) {
      err += 'No STF segment';
    }
    if (err !== '') {
      console.log(err);
      return callback(err);
    }
    patient = {};
    err = '';
    ref = message.segments;
    for (i = 0, len = ref.length; i < len; i++) {
      segment = ref[i];
      if (segment.parsed.SegmentType === 'MSH' && (segment.parsed.SendingFacility != null)) {
        if (segment.parsed.SendingFacility) {
          patient.institute = segment.parsed.SendingFacility;
        } else {
          err += 'No sending facility';
        }
      } else if (segment.parsed.SegmentType === 'PID') {
        if (segment.parsed.PatientID !== '') {
          patient.patientId = segment.parsed.PatientID;
        } else {
          err += 'No patientID';
        }
        if (segment.parsed.DateOfBirth !== '') {
          patient.birthdate = new Date(segment.parsed.DateOfBirth.slice(0, 4), parseInt(segment.parsed.DateOfBirth.slice(4, 6)) - 1, segment.parsed.DateOfBirth.slice(6, 8));
        } else {
          err += 'No birthdate';
        }
        if (segment.parsed.PatientName !== '') {
          name = segment.parsed.PatientName.split('^');
          if (name.length >= 2) {
            patient.lastName = name[0];
            patient.firstName = name[1];
          } else {
            patient.lastName = name[0];
          }
        } else {
          err += 'No patient name';
        }
        if (segment.parsed.Sex = 'M') {
          patient.gender = 'Herr';
        } else if (segment.parsed.Sex = 'F') {
          patient.gender = 'Frau';
        } else {
          err += 'No patient gender';
        }
        address = segment.parsed.Address.split('^');
        patient.street = address[0];
        if (address[4] != null) {
          patient.zipcode = parseInt(address[4]);
        }
        if (address[2] != null) {
          patient.city = address[2];
        }
        communication = segment.parsed.PhoneNumberHome.split('^');
        patient.telephone = communication[0];
        if (communication[3] != null) {
          patient.email = communication[3];
        }
      } else if (segment.parsed.SegmentType === 'IN1') {
        if (segment.parsed.InsuranceCompanyID !== '') {
          patient.insurance = segment.parsed.InsuranceCompanyID;
        } else {
          err += 'No insurance';
        }
        if (segment.parsed.InsuredsIDNumber !== '') {
          patient.insurant = segment.parsed.InsuredsIDNumber;
        } else {
          err += 'No insurant';
        }
      } else if (segment.parsed.SegmentType === 'STF') {
        if (segment.parsed.StaffIDCode !== '') {
          patient.creator = segment.parsed.StaffIDCode;
        } else {
          err += 'No staff member';
        }
      }
    }
    console.log('=====================================');
    if (err !== '') {
      console.log(err);
      return callback(err);
    }
    return userService.getUserForHl7(patient.creator, function(err, creator) {
      if (err != null) {
        console.log(err);
        return callback(err);
      }
      if ((creator == null) || creator === null) {
        console.log("Mitarbeiter mit ID: " + patient.creator + " nicht vorhanden");
        return callback("Mitarbeiter nicht vorhanden");
      }
      if (creator.token == null) {
        console.log("Mitarbeiter besitzt keinen API Token");
        return callback("Mitarbeiter besitzt keinen API Token");
      }
      if (creator.institute.toString() !== patient.institute) {
        console.log("Klinik Id des Erstellers stimmt nicht mit der des Patienten überein");
        return callback("Klinik Id des Erstellers stimmt nicht mit der des Patienten überein");
      }
      patient.creator = creator._id;
      patient.field = creator.field;
      creator.is = function(check) {
        return check === this.permissionLevel;
      };
      return patientService.createPatient(creator, patient, function(err, patientId) {
        if (err != null) {
          console.log('err', err);
          return callback(err);
        }
        return callback(null, patient);
      });
    });
  };

  createClient = function(socket, io) {
    var client;
    client = socket;
    client.name = client.remoteAddress + ":" + client.remotePort;
    clients.push(client);
    console.log("Client " + client.name + " connected");
    client.setEncoding('utf8');
    client.addListener('data', function(data) {
      var parser, s;
      parser = new Parser();
      s = new stream.Readable();
      s.push(data);
      s.push(null);
      s.pipe(replaceStream(/\r\n/g, "\r")).pipe(replaceStream(/\n/g, "\r")).pipe(split(/\r/)).pipe(parser);
      parser.on('error', function(err) {
        return console.log('Error parsing:', err);
      });
      parser.on('finish', function() {
        return console.log('Finished ', arguments);
      });
      parser.on('message', function(message) {
        return self.readMessage(message, function(err, patient) {
          if (err != null) {
            return self.sendAcknowlegmentMessage(message, false, err, client);
          } else {
            return self.sendAcknowlegmentMessage(message, true, '', client);
          }
        });
      });
    });
    client.addListener('error', function(err) {
      console.log('Stream Error' + err);
    });
    client.addListener('end', function() {
      console.log("Client " + client.name + " disconnected");
      clients.splice(clients.indexOf(client), 1);
    });
    client.addListener('finish', function() {
      return console.log('done');
    });
  };

}).call(this);
