const User = require('../models/User');

exports.uploadKyc = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const files = req.files || {};

        console.log("📂 FILES RECEIVED:", files);

        // ================= INITIALIZE KYC =================

        user.kycDocs = user.kycDocs || {};

        user.kycDocs.aadhaar =
            user.kycDocs.aadhaar || {};

        user.kycDocs.pan =
            user.kycDocs.pan || {};

        user.kycDocs.voterId =
            user.kycDocs.voterId || {};

        user.kycDocs.bank =
            user.kycDocs.bank || {};


        // ================= AADHAAR =================

        if (files.aadhaarFront?.[0]) {
            user.kycDocs.aadhaar.frontImage =
                files.aadhaarFront[0].path;
        }

        if (files.aadhaarBack?.[0]) {
            user.kycDocs.aadhaar.backImage =
                files.aadhaarBack[0].path;
        }


        // ================= PAN =================

        if (files.panFront?.[0]) {
            user.kycDocs.pan.frontImage =
                files.panFront[0].path;
        }

        if (files.panBack?.[0]) {
            user.kycDocs.pan.backImage =
                files.panBack[0].path;
        }


        // ================= VOTER ID =================

        if (files.voterFront?.[0]) {
            user.kycDocs.voterId.frontImage =
                files.voterFront[0].path;
        }

        if (files.voterBack?.[0]) {
            user.kycDocs.voterId.backImage =
                files.voterBack[0].path;
        }


        // ================= BANK =================
        // IMPORTANT:
        // Bank image must be stored inside kycDocs.bank.image

        if (files.bankDoc?.[0]) {
            user.kycDocs.bank.image =
                files.bankDoc[0].path;
        }


        // ================= KYC STATUS =================

        user.kycStatus = "pending";

        await user.save();


        // ================= RESPONSE =================

        res.json({
            message: "KYC Uploaded Successfully",
            kycStatus: user.kycStatus,
            kycDocs: user.kycDocs
        });

    } catch (error) {

        console.error("❌ KYC UPLOAD ERROR:", error);

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