const User = require('../models/User');

exports.uploadKyc = async (req, res) => {

  try {

    const user = await User.findById(req.user.id);

    if (!user)
      return res.status(404).json({ message: 'User not found' });

    const files = req.files || {};

    /* ===== Ensure Object Exist ===== */

    user.kycDocs = user.kycDocs || {};
    user.kycDocs.aadhaar = user.kycDocs.aadhaar || {};
    user.kycDocs.pan = user.kycDocs.pan || {};
    user.kycDocs.voterId = user.kycDocs.voterId || {};

    /* ===== Aadhaar ===== */

    if (files.aadhaarFront)
      user.kycDocs.aadhaar.frontImage =
        files.aadhaarFront[0].path;

    if (files.aadhaarBack)
      user.kycDocs.aadhaar.backImage =
        files.aadhaarBack[0].path;


    /* ===== PAN ===== */

    if (files.panFront)
      user.kycDocs.pan.frontImage =
        files.panFront[0].path;

    if (files.panBack)
      user.kycDocs.pan.backImage =
        files.panBack[0].path;


    /* ===== Voter ===== */

    if (files.voterFront)
      user.kycDocs.voterId.frontImage =
        files.voterFront[0].path;

    if (files.voterBack)
      user.kycDocs.voterId.backImage =
        files.voterBack[0].path;

    user.kycStatus = 'pending';

    await user.save();

    res.json({
      message: 'KYC Uploaded Successfully',
      kycStatus: user.kycStatus
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

};



exports.approveKyc = async (req, res) => {

  try {

    const user = await User.findById(req.body.userId);

    if (!user)
      return res.status(404).json({ message: 'User not found' });

    user.kycStatus = 'approved';

    await user.save();

    res.json({ message: 'KYC Approved' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

};

