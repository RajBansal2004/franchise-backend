// simple nodemailer setup placeholder - fill with SMTP credentials
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: { user: 'user', pass: 'pass' }
});

exports.sendMail = async ({ to, subject, text, html }) => {
  const info = await transporter.sendMail({ from: '"NoReply" <no-reply@example.com>', to, subject, text, html });
  return info;
};
