(function() {
  module.exports = function(environment, recipient, subject, plainText, htmlText, cb) {
    var mailConfiguration, mailOptions, nodemailer, transporter;
    nodemailer = require('nodemailer');
    mailConfiguration = require('../config/email.js').getEmailConfig(environment);
    if (mailConfiguration.service != null) {
      transporter = nodemailer.createTransport({
        service: mailConfiguration.service,
        auth: {
          user: mailConfiguration.user,
          pass: mailConfiguration.pass
        }
      });
    } else {
      transporter = nodemailer.createTransport("SMTP", {
        host: mailConfiguration.host,
        secureConnection: false,
        port: mailConfiguration.port,
        auth: {
          user: mailConfiguration.user,
          pass: mailConfiguration.pass
        },
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false
        }
      });
    }
    mailOptions = {
      from: mailConfiguration.from,
      sender: mailConfiguration.from,
      replyTo: mailConfiguration.from,
      to: recipient,
      subject: subject,
      text: plainText,
      html: htmlText
    };
    return transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log(error);
        return cb(error);
      } else {
        return cb(null);
      }
    });
  };

}).call(this);
