const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { countLevelMembers } = require('../utils/levelCounter');
const calculateStepPending = require('../utils/stepPendingCalculator');
const Product = require('../models/Product');
const checkLevels = require('../utils/levelChecker');
const ROYALTY_CONFIG = require('../config/royalty.config');


exports.purchaseProduct = async (req, res) => {
  try {
    const user = req.user;
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const totalBP = product.bp * quantity;

    // 🔹 SELF BP
    user.selfBP += totalBP;

    // 🔹 BINARY BP (DIRECT PARENT)
    if (user.parentId) {
      const parent = await User.findById(user.parentId);

      if (user.position === 'LEFT') {
        parent.leftBP += totalBP;
      } else {
        parent.rightBP += totalBP;
      }

      await parent.save();
    }

    // 🔹 LEVEL CHECK
    await checkLevels(user);

    await user.save();

    res.json({
      message: 'Purchase successful',
      bpAdded: totalBP,
      level: user.level,
      rank: user.currentRank
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getStepPending = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const steps = calculateStepPending(user);

    res.json({
      user: {
        name: user.fullName,
        level: user.level
      },
      steps
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.getRoyaltySummary = async (req, res) => {
  try {

    const user = await User.findById(req.user._id);

    const leftBP = user.monthlyLeftBP || 0;
    const rightBP = user.monthlyRightBP || 0;

    const consideredBP = Math.min(leftBP, rightBP);

    const levels = ROYALTY_CONFIG.map(item => {

      const percentage =
        item.minPercent === item.maxPercent
          ? `${item.minPercent}%`
          : `${item.minPercent}-${item.maxPercent}%`;

      return {
        level: item.level,
        targetAmount: item.target,   // 👈 important rename
        percentage,
        status: consideredBP >= item.target ? "Eligible" : "Not Eligible"
      };
    });

    res.json({
      currentLevel: user.level,
      leftBP,
      rightBP,
      consideredBP,
      royaltyIncome: user.royaltyIncome || 0,
      levels
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




exports.getUserDashboard = async (req, res) => {
  try {

    const userId = req.user._id;

    const user = await User.findById(userId);
    const wallet = await Wallet.findOne({ user: userId });

    /* ================= TEAM SUMMARY ================= */

    const directTeam = await User.countDocuments({ parentId: userId });

    const teamMembers = await User.find({ parentId: userId });

    const activeTeam = teamMembers.filter(u => u.isActive).length;
    const inactiveTeam = teamMembers.length - activeTeam;

    const incentiveActive = teamMembers.filter(u => u.selfBP > 0).length;
    const incentiveInactive = teamMembers.length - incentiveActive;

    /* ================= RESPONSE ================= */

    res.json({

      /* ===== PROFILE ===== */

     profile:{
  name: user.fullName,
  dsId: user.uniqueId,
  referralId: user.uniqueId, // अगर अलग referral field है तो change करो

  fatherName: user.fatherName || "",
  gender: user.gender || "",

  mobile: user.mobile,
  email: user.email,
  photo:user.photo,
  dob:user.dob,

  // ⭐ LOCATION ADDRESS (Permanent Address)
  pincode: user.location?.pincode || "",
  district: user.location?.district || "",
  state: user.location?.state || "",
  address: `${user.location?.village || ""} ${user.location?.block || ""}`.trim(),

shippingAddress: user.shippingAddress || {},
  status: user.isActive ? 'Active' : 'Inactive',
  photo: user.photo
},


      /* ===== BUSINESS SUMMARY ===== */

      business:{
        selfBP:user.selfBP || 0,

        totalBonusBP:user.leftBP || 0,
        totalIncentiveBP:user.rightBP || 0,

        weeklyBonusBP:user.weeklyLeftBP || 0,
        weeklyIncentiveBP:user.weeklyRightBP || 0,

        monthlyBonusBP:user.monthlyLeftBP || 0,
        monthlyIncentiveBP:user.monthlyRightBP || 0
      },

      /* ===== INCOME SUMMARY ===== */

      income:{
        weeklyIncome:user.weeklyIncome || 0,
        monthlyIncome:user.monthlyIncome || 0,

        thirdLegIncome:user.thirdLegIncome || 0,
        royaltyIncome:user.royaltyIncome || 0,
        levelRewardIncome:user.levelRewardIncome || 0,

        totalIncome:user.totalIncome || 0,

        walletBalance: wallet?.balance || user.incomeWallet || 0
      },

      /* ===== TEAM SUMMARY ===== */

      team:{
        directTeam,
        totalTeam: teamMembers.length,
        activeTeam,
        inactiveTeam,
        incentiveTeam:{
          active: incentiveActive,
          inactive: incentiveInactive
        }
      }

    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getIdCard = async (req, res) => {
 try {

  const user = await User.findById(req.user._id)
  .select("fullName uniqueId mobile photo kycDocs kycStatus shippingAddress");

  if(!user){
    return res.status(404).json({msg:"User not found"});
  }

  res.json({
    name: user.fullName,
  dsId: user.uniqueId,
  referralId: user.uniqueId, 

  fatherName: user.fatherName || "",
  gender: user.gender || "",

  mobile: user.mobile,
  email: user.email,

  pincode: user.pincode || "",
  district: user.district || "",
  state: user.state || "",

  address: user.address || "",
  shippingAddress: user.shippingAddress || "",
  kyc:user.kycDocs,
    kycStatus:user.kycStatus,
  status: user.isActive ? 'Active' : 'Inactive',
  photo: user.photo
  });

 } catch (err) {
  console.log(err);
  res.status(500).json({ msg: "ID card fetch error" });
 }
};

/* ===== Update Shipping Address ===== */

exports.updateShippingAddress = async (req, res) => {
  try {

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const { addressLine } = req.body;

    user.shippingAddress = { addressLine };

    await user.save();

    res.json({
      msg: "Shipping address updated successfully",
      shippingAddress: user.shippingAddress
    });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.updatePhoto = async (req, res) => {
  try {

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (!req.file) {
      return res.status(400).json({ msg: "No photo uploaded" });
    }

    // Save file path in database
    user.photo = `/uploads/${req.file.filename}`;

    await user.save();

    res.json({
      msg: "Photo updated successfully",
      photo: user.photo
    });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
