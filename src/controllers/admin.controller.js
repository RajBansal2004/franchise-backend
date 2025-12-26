const User = require('../models/User');
const Kyc = require('../models/Kyc');
const { generateFranchiseId, generatePassword } = require('../utils/credentials');
const SmsLog = require('../models/SmsLog');
const { sendSMS } = require('../utils/sms');
exports.getSmsLogs = async (req, res) => {
  const logs = await SmsLog.find()
    .sort({ createdAt: -1 })
    .limit(100);

  res.json(logs);
};

exports.createAdmin = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    if (!['ADMIN', 'SUBADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const uniqueId =
      role === 'ADMIN'
        ? `ADM-${Date.now()}`
        : `SUB-${Date.now()}`;

    await User.create({
      fullName,
      email,
      password,
      role,
      uniqueId,
      mobile: `${role}-${Date.now()}`,
      gender: 'other',
      dob: new Date('2000-01-01'),
      kycStatus: 'approved'
    });

    res.status(201).json({
      message: `${role} created successfully`,
      uniqueId
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/**
 * 🔹 GET ALL PENDING KYC
 */
exports.getPendingKyc = async (req, res) => {
  const list = await Kyc.find({ status: 'pending' })
    .populate('user', 'fullName email mobile role uniqueId');

  res.json(list);
};

/**
 * 🔹 APPROVE / REJECT KYC
 */
exports.updateKycStatus = async (req, res) => { 
  const { kycId } = req.params;
  const { status } = req.body; // approved | rejected

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const kyc = await Kyc.findById(kycId);
  if (!kyc) {
    return res.status(404).json({ message: 'KYC not found' });
  }

  // update KYC
  kyc.status = status;
  await kyc.save();

  // update USER
  await User.findByIdAndUpdate(kyc.user, {
    kycStatus: status
  });

  res.json({
    message: `KYC ${status} successfully`
  });
};


exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalFranchises,

      activeUsers,
      inactiveUsers,

      kycApproved,
      kycPending,
      kycRejected
    ] = await Promise.all([

      User.countDocuments({ role: 'USER' }),
      User.countDocuments({ role: 'FRANCHISE' }),

      User.countDocuments({
        role: { $in: ['USER', 'FRANCHISE'] },
        kycStatus: 'approved'
      }),

      User.countDocuments({
        role: { $in: ['USER', 'FRANCHISE'] },
        kycStatus: { $ne: 'approved' }
      }),

      User.countDocuments({ kycStatus: 'approved' }),
      User.countDocuments({ kycStatus: 'pending' }),
      User.countDocuments({ kycStatus: 'rejected' })

    ]);

    res.json({
      totalUsers,
      totalFranchises,
      activeUsers,
      inactiveUsers,
      kyc: {
        approved: kycApproved,
        pending: kycPending,
        rejected: kycRejected
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { role, kycStatus } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (kycStatus) filter.kycStatus = kycStatus;

    const users = await User.find(filter)
      .select('fullName email mobile role kycStatus uniqueId createdAt')
      .sort({ createdAt: -1 });

    res.json(users);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// exports.createFranchiseByAdmin = async (req, res) => {
//   try {
//     const {
//       fullName,
//       dob,
//       gender,
//       mobile,
//       email,
//       location,
//       referralId
//     } = req.body;

//     if (!fullName || !mobile || !location?.state) {
//       return res.status(400).json({ message: 'Required fields missing' });
//     }

//     // allow same mobile/email for other roles
//     const exists = await User.findOne({
//       mobile,
//       role: 'FRANCHISE'
//     });

//     if (exists) {
//       return res.status(400).json({ message: 'Franchise already exists' });
//     }

//     const franchiseId = generateFranchiseId();
//     const password = generatePassword();

//     await User.create({
//       fullName,
//       dob,
//       gender,
//       mobile,
//       email,
//       role: 'FRANCHISE',
//       uniqueId: franchiseId,
//       password,
//       referralId,
//       location,
//       kycStatus: 'pending'
//     });

//     // 🔔 SMS integration later
//     console.log(`SMS → ${mobile}`);
//     console.log(`ID: ${franchiseId}, Password: ${password}`);

// await sendSMS({
//   mobile,
//   purpose: 'CREDENTIALS',
//   message: `Welcome Franchise!
// login ID: ${franchiseId}
// Password: ${password}`
// });

//     res.status(201).json({
//       message: 'Franchise created by admin',
//       franchiseId
//     });

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


exports.createFranchiseByAdmin = async (req, res) => {
  try {
    const { fullName, mobile, email, kycDocs, location } = req.body;

    if (!fullName || !mobile || !kycDocs) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    if (
      !kycDocs.aadhaar &&
      !kycDocs.voterId &&
      !kycDocs.drivingLicence
    ) {
      return res.status(400).json({
        message: 'Any one KYC document required'
      });
    }

    const password = generatePassword();
    const franchiseId = generateFranchiseId();

    const franchise = await User.create({
      fullName,
      mobile,
      email,
      password,
      uniqueId: franchiseId,
      role: 'FRANCHISE',
      location,
      kycDocs
    });

    // 📲 SEND SMS
    await sendSMS({
      mobile,
      message: `Welcome Franchise!
ID: ${franchiseId}
Password: ${password}
Login: Your registered ID`
    });

    res.status(201).json({
      message: 'Franchise created & SMS sent',
      franchiseId
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
