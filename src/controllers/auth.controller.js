const User = require('../models/User');
const Kyc = require('../models/Kyc');
const jwt = require('jsonwebtoken');

/* 🔹 Helper for DS ID */
const generateDSId = (fullName, mobile) => {
  if (!fullName || !mobile) {
    throw new Error('Full name and mobile are required for DS ID generation');
  }

  const parts = fullName.trim().split(' ');
  const firstLetter = parts[0][0].toUpperCase();
  const lastLetter =
    parts.length > 1
      ? parts[parts.length - 1][0].toUpperCase()
      : parts[0][0].toUpperCase();

  const last4 = mobile.slice(-4);

  return `${firstLetter}${lastLetter}${last4}`;
};


/* 🔹 DS REGISTER */
exports.registerDS = async (req, res) => {
  try {
    const {
      fullName,
      dob,
      gender,
      mobile,
      email,
      password,
      referralId
    } = req.body;

    // 🔒 Validation (VERY IMPORTANT)
    if (!fullName || !dob || !gender || !mobile || !email || !password) {
      return res.status(400).json({
        message: 'All required fields are mandatory'
      });
    }

    const uniqueId = generateDSId(fullName, mobile);

    const user = await User.create({
      fullName,
      dob,
      gender,
      mobile,
      email,
      password,
      referralId,
      role: 'USER',
      uniqueId
    });

    res.status(201).json({
      message: 'User Registered Successfully',
      dsId: uniqueId
    });

  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};


/* 🔹 FRANCHISE REGISTER */

exports.registerFranchise = async (req, res) => {
  try {
    const {
      fullName,
      dob,
      gender,
      mobile,
      email,
      password,
      state,
      city,
      fullAddress,
      aadhaar,
      pan,
      passport,
      referralId
    } = req.body;

    // ✅ REQUIRED FIELD VALIDATION
    if (
      !fullName || !dob || !gender ||
      !mobile || !email || !password ||
      !state || !city || !fullAddress
    ) {
      return res.status(400).json({
        message: 'All mandatory fields are required'
      });
    }

    // ✅ KYC VALIDATION (at least one)
    if (!aadhaar && !pan && !passport) {
      return res.status(400).json({
        message: 'At least one KYC document is required'
      });
    }

    // ✅ UNIQUE CHECK
    const exists = await User.findOne({
      $or: [{ email }, { mobile }]
    });
    if (exists) {
      return res.status(400).json({
        message: 'Email or Mobile already registered'
      });
    }

    // ✅ AUTO FRANCHISE ID
    const franchiseId = `FRN${Date.now()}`;

    // ✅ CREATE USER
    const user = await User.create({
      fullName,
      dob,
      gender,
      mobile,
      email,
      password,
      role: 'FRANCHISE',
      uniqueId: franchiseId,
      referralId,
      address: {
        state,
        city,
        fullAddress
      }
    });

    await Kyc.create({
      user: user._id,
      aadhaar,
      pan,
      passport
    });

    res.status(201).json({
      message: 'Franchise Registered Successfully',
      franchiseId
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    console.log("LIVE USER FOUND:", user ? user.email : null);

    // if (!user || !(await user.comparePassword(password))) {
    //   return res.status(400).json({ message: 'Invalid credentials' });
    // }

const isMatch = await user.comparePassword(password);
console.log("PASSWORD MATCH:", isMatch);
    // 🔐 KYC CHECK ONLY FOR USER & FRANCHISE
    if (
      ['USER', 'FRANCHISE'].includes(user.role) &&
      user.kycStatus !== 'approved'
    ) {
      return res.status(403).json({
        message: `KYC ${user.kycStatus}. Login not allowed`
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.fullName,
        role: user.role,
        uniqueId: user.uniqueId
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

