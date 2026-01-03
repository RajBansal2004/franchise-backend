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
      // USERS
      totalUsers,
      activeUsers,
      inactiveUsers,
      blockedUsers,

      // FRANCHISE
      totalFranchises,
      activeFranchises,
      inactiveFranchises,
      blockedFranchises,

      // KYC
      kycApproved,
      kycPending,
      kycRejected
    ] = await Promise.all([

      // USERS
      User.countDocuments({ role: 'USER' }),
      User.countDocuments({ role: 'USER', isActive: true, isBlocked: false }),
      User.countDocuments({ role: 'USER', isActive: false, isBlocked: false }),
      User.countDocuments({ role: 'USER', isBlocked: true }),

      // FRANCHISE
      User.countDocuments({ role: 'FRANCHISE' }),
      User.countDocuments({ role: 'FRANCHISE', isActive: true, isBlocked: false }),
      User.countDocuments({ role: 'FRANCHISE', isActive: false, isBlocked: false }),
      User.countDocuments({ role: 'FRANCHISE', isBlocked: true }),

      // KYC
      User.countDocuments({ kycStatus: 'approved' }),
      User.countDocuments({ kycStatus: 'pending' }),
      User.countDocuments({ kycStatus: 'rejected' })
    ]);

    res.json({
      success: true,
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        blocked: blockedUsers
      },
      franchises: {
        total: totalFranchises,
        active: activeFranchises,
        inactive: inactiveFranchises,
        blocked: blockedFranchises
      },
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


exports.toggleBlockStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isBlocked } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isBlocked = isBlocked;

    if (isBlocked) {
      user.isActive = false; // auto deactivate
    }

    await user.save();

    res.json({
      message: `User ${isBlocked ? 'Blocked' : 'Unblocked'} successfully`
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleActiveStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      message: `User ${isActive ? 'Activated' : 'Deactivated'} successfully`
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const {
      role,        // USER | FRANCHISE
      isActive,    // true | false
      isBlocked,   // true | false
      kycStatus,   // pending | approved | rejected
      page = 1,
      limit = 10,
      search
    } = req.query;

    const filter = {};

    // role wise
    if (role) filter.role = role;

    // active / inactive
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // blocked
    if (isBlocked !== undefined) {
      filter.isBlocked = isBlocked === 'true';
    }

    // kyc
    if (kycStatus) filter.kycStatus = kycStatus;

    // search
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { uniqueId: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('fullName uniqueId mobile role isActive isBlocked kycStatus createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),

      User.countDocuments(filter)
    ]);

    res.json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: users
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createFranchiseByAdmin = async (req, res) => {
  try {
    const { fullName,organizationName, mobile, email, kycDocs, location } = req.body;

    if (!fullName || !organizationName || !mobile || !kycDocs) {
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
      organizationName,
      mobile,
      email,
      password,
      uniqueId: franchiseId,
      role: 'FRANCHISE',
      location,
      kycDocs
    });

    // 📲 SEND SMS
//     await sendSMS({
//       mobile,
//       message: `Welcome Franchise!
// ID: ${franchiseId}
// Password: ${password}
// Login: Your registered ID`
//     });

    res.status(201).json({
      message: 'Franchise created & SMS sent',
      franchiseId
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
