const User = require('../models/User');
const Kyc = require('../models/Kyc');
const jwt = require('jsonwebtoken');
const { generateOTP } = require('../utils/otp');
const { sendOTPEmail } = require('../utils/email');
const { generateDSId, generatePassword } = require('../utils/credentials');
const { sendCredentials } = require('../utils/notify');
const { sendSMS } = require('../utils/sms');
const bcrypt = require('bcryptjs');

exports.registerDS = async (req, res) => {  
  try {
    const {
      fullName,
      fatherName,
      dob,
      gender,
      mobile,
      email,
      referralId,
      position, 
      location,
      kycDocs
    } = req.body;

    console.log('RAW BODY:', req.body);
    console.log('fatherName:', req.body.fatherName);

    if (!fullName || !fatherName || !dob || !gender || !mobile) {
      return res.status(400).json({ message: 'All fields required' });
    }

    if (!position || !['LEFT','RIGHT'].includes(position)) {
      return res.status(400).json({ message: 'Position must be LEFT or RIGHT' });
    }

    /* ================= FIND REFERRAL ================= */
    let parentUser = null;

      /* ================= KYC VALIDATION ================= */
    const hasAnyKyc =
      kycDocs &&
      (
        kycDocs.aadhaar ||
        kycDocs.voterId ||
        kycDocs.drivingLicence
      );

    if (!hasAnyKyc) {
      return res.status(400).json({
        message: 'Any one KYC document is required (Aadhaar / Voter ID / Driving Licence)'
      });
    }
  /* ================= FIND REFERRAL ================= */

if (!referralId) {
  return res.status(400).json({
    message: 'Referral ID is required'
  });
}

parentUser = await User.findOne({ uniqueId: referralId });

if (!parentUser) {
  return res.status(400).json({
    message: 'Invalid referral ID'
  });
}

if (position === 'LEFT' && parentUser.leftChild) {
  return res.status(400).json({
    message: 'Left side already occupied'
  });
}

if (position === 'RIGHT' && parentUser.rightChild) {
  return res.status(400).json({
    message: 'Right side already occupied'
  });
}

    /* ================= CREATE USER ================= */
    const uniqueId = generateDSId(fullName, mobile);
    const password = generatePassword();

    const user = await User.create({
      fullName,
      fatherName,
      dob,
      gender,
      mobile,
      email,
      password,
      role: 'USER',
      uniqueId,
      referralId,
      parentId: parentUser ? parentUser._id : null,
      position: parentUser ? position : null,
      level: parentUser ? parentUser.level + 1 : 0,
      location,
      kycDocs,
      kycStatus: 'pending'
    });

    /* ================= ATTACH TO TREE ================= */
    if (parentUser) {
      if (position === 'LEFT') parentUser.leftChild = user._id;
      if (position === 'RIGHT') parentUser.rightChild = user._id;
      await parentUser.save();
    }

    /* ================= SEND CREDENTIALS ================= */
//     await sendSMS({
//       mobile,
//       purpose: 'CREDENTIALS',
//       message: `Welcome to Sushen Sanjeevani
// ID: ${uniqueId}
// Password: ${password}`
//     });

console.log(uniqueId)
console.log(password)
    res.status(201).json({
      message: 'Direct Seller registered successfully',
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


exports.getReferralUser = async (req, res) => {
  const { referralId } = req.params;

  const user = await User.findOne({ uniqueId: referralId })
    .select('fullName uniqueId');

  if (!user) {
    return res.status(404).json({
      message: 'Invalid referral ID'
    });
  }

  res.json({
    fullName: user.fullName,
    uniqueId: user.uniqueId
  });
};

exports.getMyTree = async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId)
    .populate('leftChild')
    .populate('rightChild');

  res.json(user);
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
