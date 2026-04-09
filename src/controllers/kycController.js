const User = require('../models/User');

exports.uploadKyc = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const files = req.files || {};

    console.log("📂 FILES RECEIVED:", files);

    // ===== Ensure Object Exist =====
    user.kycDocs = user.kycDocs || {};
    user.kycDocs.aadhaar = user.kycDocs.aadhaar || {};
    user.kycDocs.pan = user.kycDocs.pan || {};
    user.kycDocs.voterId = user.kycDocs.voterId || {};

    // ===== Aadhaar =====
    if (files.aadhaarFront) {
      user.kycDocs.aadhaar.frontImage =
        files.aadhaarFront[0].path || files.aadhaarFront[0].secure_url;
    }

    if (files.aadhaarBack) {
      user.kycDocs.aadhaar.backImage =
        files.aadhaarBack[0].path || files.aadhaarBack[0].secure_url;
    }

    // ===== PAN =====
    if (files.panFront) {
      user.kycDocs.pan.frontImage =
        files.panFront[0].path || files.panFront[0].secure_url;
    }

    if (files.panBack) {
      user.kycDocs.pan.backImage =
        files.panBack[0].path || files.panBack[0].secure_url;
    }

    // ===== Voter =====
    if (files.voterFront) {
      user.kycDocs.voterId.frontImage =
        files.voterFront[0].path || files.voterFront[0].secure_url;
    }

    if (files.voterBack) {
      user.kycDocs.voterId.backImage =
        files.voterBack[0].path || files.voterBack[0].secure_url;
    }

    // ===== Bank Doc =====
    if (files.bankDoc) {
      user.bankDoc =
        files.bankDoc[0].path || files.bankDoc[0].secure_url;
    }

    // ===== Status =====
    user.kycStatus = 'pending';

    await user.save();

    console.log("✅ SAVED USER:", user.kycDocs);

    res.json({
      message: 'KYC Uploaded Successfully',
      kycStatus: user.kycStatus,
      kycDocs: user.kycDocs
    });

  } catch (error) {
    console.error("❌ KYC ERROR:", error);
    res.status(500).json({
      error: error.message
    });
  }
};


exports.approveKyc = async (req, res) => {
  try {
    const { userId, status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.kycStatus = status;

    await user.save();

    res.json({
      message: `KYC ${status} successfully`,
      kycStatus: user.kycStatus
    });

  } catch (err) {
    console.error("❌ APPROVE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};