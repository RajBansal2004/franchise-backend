const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendOTPEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"Franchise App" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your OTP Code',
    html: `<h3>Your OTP is: <b>${otp}</b></h3><p>Valid for 5 minutes</p>`
  });
};
