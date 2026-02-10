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
      location
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

    /* ================= LOCATION ================= */
    let parsedLocation = {};
if (location) {
  try {
    parsedLocation = JSON.parse(location);
  } catch (e) {
    return res.status(400).json({
      message: 'Invalid location JSON format'
    });
  }
}

    /* ================= KYC FILES ================= */
    const aadhaarImage = req.files?.aadhaarImage?.[0]?.filename || null;
    const panImage = req.files?.panImage?.[0]?.filename || null;
    const voterImage = req.files?.voterImage?.[0]?.filename || null;

    const { aadhaarNumber, panNumber, voterNumber } = req.body;

    /* ================= KYC VALIDATION ================= */
    let kycDocs = {};

    if (aadhaarNumber && aadhaarImage) {
      kycDocs.aadhaar = {
        number: aadhaarNumber,
        image: `/uploads/kyc/${aadhaarImage}`
      };
    }

    if (panNumber && panImage) {
      kycDocs.pan = {
        number: panNumber,
        image: `/uploads/kyc/${panImage}`
      };
    }

    if (voterNumber && voterImage) {
      kycDocs.voterId = {
        number: voterNumber,
        image: `/uploads/kyc/${voterImage}`
      };
    }

    if (Object.keys(kycDocs).length === 0) {
      return res.status(400).json({
        message: 'At least one complete KYC document (number + image) is required'
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

const leftCount = parentUser.leftChildren?.length || 0;
const rightCount = parentUser.rightChildren?.length || 0;


if (position === 'LEFT' && leftCount > rightCount) {
  return res.status(400).json({
    message: 'First complete RIGHT to make pair'
  });
}

if (position === 'RIGHT' && rightCount > leftCount) {
  return res.status(400).json({
    message: 'First complete LEFT to make pair'
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
      location:parsedLocation,
      kycDocs,
      kycStatus: 'pending'
    });

    /* ================= ATTACH TO TREE ================= */
   if (parentUser) {

  if (position === 'LEFT') {
    parentUser.leftChildren.push(user._id);
  }

  if (position === 'RIGHT') {
    parentUser.rightChildren.push(user._id);
  }

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

console.log(uniqueId);
console.log(password);

    res.status(201).json({
      message: 'Direct Seller registered successfully',
      loginId: uniqueId,
      password:password
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
