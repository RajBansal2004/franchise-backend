const User = require('../models/User');
const Kyc = require('../models/Kyc');

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

    // ✅ UNIQUE ID FOR ADMIN/SUBADMIN
    const uniqueId =
      role === 'ADMIN'
        ? `ADM-${Date.now()}`
        : `SUB-${Date.now()}`;

    const admin = await User.create({
      fullName,
      email,
      password,
      role,
      uniqueId,

      // required dummy fields
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
