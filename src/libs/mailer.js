const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE,
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_SMTP,
    pass: process.env.PASS_SMTP,
  },
});

module.exports = { transporter };
