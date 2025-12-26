const User = require('../models/User');
const Kyc = require('../models/Kyc');
const jwt = require('jsonwebtoken');
const { generateOTP } = require('../utils/otp');
const { sendOTPEmail } = require('../utils/email');
const { generateDSId, generatePassword } = require('../utils/credentials');
const { sendCredentials } = require('../utils/notify');
const { sendSMS } = require('../utils/sms');
exports.registerDS = async (req, res) => {
  try {
    const {
      fullName,
      dob,
      gender,
      mobile,
      email,
      referralId,
      location,
      kycDocs
    } = req.body;

    if (!fullName || !dob || !gender || !mobile || !email) {
      return res.status(400).json({ message: 'All fields required' });
    }

    if (
      !kycDocs ||
      (!kycDocs.aadhaar &&
       !kycDocs.voterId &&
       !kycDocs.drivingLicence)
    ) {
      return res.status(400).json({
        message: 'At least one KYC document is required'
      });
    }

    const uniqueId = generateDSId(fullName, mobile);
    const password = generatePassword();

    const user = await User.create({
      fullName,
      dob,
      gender,
      mobile,
      email,
      password,
      referralId,
      role: 'USER',
      uniqueId,
      location,
      kycDocs,
      kycStatus: 'pending'
    });

    await sendSMS({
      mobile,
      purpose: 'CREDENTIALS',
      message: `Welcome DS
ID: ${uniqueId}
Password: ${password}`
    });

    res.status(201).json({
      message: 'DS registered successfully',
      loginId: uniqueId
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




exports.login = async (req, res) => {
  const { loginId, password } = req.body;

  const user = await User.findOne({
    $or: [{ email: loginId }, { uniqueId: loginId }]
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.json({
    token,
    user: {
      role: user.role,
      uniqueId: user.uniqueId,
      kycStatus: user.kycStatus
    }
  });
};




exports.sendForgotPasswordOTP = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const otp = generateOTP();
  const hashedOtp = await bcrypt.hash(otp, 10);

  user.otp = {
    code: hashedOtp,
    expiresAt: Date.now() + 5 * 60 * 1000
  };
  await user.save();

  await sendOTPEmail(email, otp);

  res.json({ message: 'OTP sent to email' });
};


exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user || !user.otp) {
    return res.status(400).json({ message: 'Invalid request' });
  }

  if (Date.now() > user.otp.expiresAt) {
    return res.status(400).json({ message: 'OTP expired' });
  }

  const isValid = await bcrypt.compare(otp, user.otp.code);
  if (!isValid) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  res.json({ message: 'OTP verified successfully' });
};

exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user || !user.otp) {
    return res.status(400).json({ message: 'Invalid request' });
  }

  if (Date.now() > user.otp.expiresAt) {
    return res.status(400).json({ message: 'OTP expired' });
  }

  const isValid = await bcrypt.compare(otp, user.otp.code);
  if (!isValid) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  user.password = newPassword; // model will hash
  user.otp = undefined;
  await user.save();

  res.json({ message: 'Password reset successfully' });
};
