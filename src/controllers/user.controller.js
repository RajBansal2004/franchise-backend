const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { countLevelMembers } = require('../utils/levelCounter');
const calculateStepPending = require('../utils/stepPendingCalculator');
const Product = require('../models/Product');
const checkLevels = require('../utils/levelChecker');
const ROYALTY_CONFIG = require('../config/royalty.config');
const { getAllDownline } = require('../utils/teamCounter');
const matchingIncome = require('../utils/matchingIncome');
const calculateMonthlyIncome = require('../utils/monthlyIncome');
const repurchaseIncome = require("../utils/repurchaseIncome");
const thirdLegIncome = require("../utils/thirdLegIncome");
const checkRepurchaseEligibility = require('../utils/checkRepurchaseEligibility');


exports.purchaseProduct = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const totalBP = product.bp * quantity;

    // 🔹 SELF BP
    user.selfBP += totalBP;
    await user.save();

    // 2. PARENT UPDATE
    if (user.parentId) {
      const parent = await User.findById(user.parentId);

      if (user.position === 'LEFT') {
        parent.leftBP += totalBP;
        parent.weeklyLeftBP += totalBP;
        parent.monthlyLeftBP += totalBP;
        parent.repurchaseLeftBP += totalBP;
      } else {
        parent.rightBP += totalBP;
        parent.weeklyRightBP += totalBP;
        parent.monthlyRightBP += totalBP;
        parent.repurchaseRightBP += totalBP;
      }
      // ✅ THIRD LEG BP (Only 3rd Direct Member Purchase)
      const children = await User.find({
        parentId: parent._id
      }).sort({ createdAt: 1 });

      if (children.length >= 3) {

        const thirdUser = children[2];

        if (thirdUser._id.toString() === user._id.toString()) {

          parent.thirdLegBP = (parent.thirdLegBP || 0) + totalBP;

          await parent.save();

          await checkLevels(parent);
          await matchingIncome(parent._id);
          await thirdLegIncome(parent._id);


        } else {

          await parent.save();

          await checkLevels(parent);
          // Matching Income
          await matchingIncome(parent._id);
        }

      } else {

        await parent.save();

        await checkLevels(parent);
        // Matching Income
        await matchingIncome(parent._id);

      }
    }

    // 3. USER LEVEL
    await checkLevels(user);
    console.log("Calling repurchaseIncome");
    console.log("BP =", totalBP);
    console.log("User =", user.uniqueId);
    await repurchaseIncome(user._id, totalBP);

    const updatedUser = await User.findById(user._id);

    res.json({
      message: "Purchase successful",
      bpAdded: totalBP,
      level: updatedUser.level,
      rank: updatedUser.currentRank
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

      // ✅ IMPORTANT FIX (level check)
      let status = "Locked";

      if (user.level >= item.level) {
        status = consideredBP >= item.target
          ? "Eligible"
          : "Not Eligible";
      }

      return {
        level: item.level,
        targetAmount: item.target,
        percentage,
        status
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
    await checkRepurchaseEligibility(user);
    let user = await User.findById(userId);
    const wallet = await Wallet.findOne({ user: userId });

    /* ================= TEAM SUMMARY ================= */

    const directTeam = await User.countDocuments({ parentId: userId });

    const allTeam = await getAllDownline(userId);
    // ✅ LEFT SIDE TEAM (Bonus Team)
    const leftTeam = allTeam.filter(u => u.position === "LEFT");

    // ✅ RIGHT SIDE TEAM (Incentive Team)
    const rightTeam = allTeam.filter(u => u.position === "RIGHT");

    // TOTAL
    const totalTeam = allTeam.length;

    // ACTIVE / INACTIVE (FULL TREE)
    const activeTeam = allTeam.filter(u => u.isActive).length;
    const inactiveTeam = totalTeam - activeTeam;

    // ✅ BONUS TEAM (LEFT SIDE)
    const bonusActive = leftTeam.filter(u => u.isActive).length;
    const bonusInactive = leftTeam.length - bonusActive;

    // ✅ INCENTIVE TEAM (RIGHT SIDE)
    const incentiveActive = rightTeam.filter(u => u.isActive).length;
    const incentiveInactive = rightTeam.length - incentiveActive;

    /* ================= RESPONSE ================= */

    res.json({

      /* ===== PROFILE ===== */
      notification: {

        repurchase: {
          show: user.isIncomeFrozen,

          requiredBP: user.requiredRepurchaseBP,

          currentBP: user.lastRepurchaseBP,

          pendingBP:
            Math.max(
              user.requiredRepurchaseBP - user.lastRepurchaseBP,
              0
            ),

          title: "Repurchase Required",

          message: user.isIncomeFrozen
            ? `Please complete ${user.requiredRepurchaseBP} BP repurchase to continue your income.`
            : ""

        }

      },

      profile: {
        name: user.fullName,
        dsId: user.uniqueId,
        referralId: user.uniqueId, // अगर अलग referral field है तो change करो

        fatherName: user.fatherName || "",
        gender: user.gender || "",

        mobile: user.mobile,
        email: user.email,
        photo: user.photo,
        dob: user.dob,

        // ⭐ LOCATION ADDRESS (Permanent Address)
        pincode: user.location?.pincode || "",
        district: user.location?.district || "",
        state: user.location?.state || "",
        address: `${user.location?.village || ""} ${user.location?.block || ""}`.trim(),

        shippingAddress: user.shippingAddress || {},
        status: user.isActive ? 'Active' : 'Inactive',
        photo: user.photo,
        // 🔥🔥🔥 YE LINE ADD KARO (MAIN FIX)
        kycStatus: user.kycStatus,

        // (optional but useful)
        kycDocs: user.kycDocs,
      },


      /* ===== BUSINESS SUMMARY ===== */

      business: {
        selfBP: user.selfBP || 0,

        totalBonusBP: user.leftBP || 0,
        totalIncentiveBP: user.rightBP || 0,

        weeklyBonusBP: user.weeklyLeftBP || 0,
        weeklyIncentiveBP: user.weeklyRightBP || 0,

        monthlyBonusBP: user.monthlyLeftBP || 0,
        monthlyIncentiveBP: user.monthlyRightBP || 0
      },

      /* ===== INCOME SUMMARY ===== */

      income: {
        weeklyIncome: user.weeklyIncome || 0,
        monthlyIncome: user.monthlyIncome || 0,

        thirdLegIncome: user.thirdLegIncome || 0,
        royaltyIncome: user.royaltyIncome || 0,
        levelRewardIncome: user.levelRewardIncome || 0,


        totalIncome: user.totalIncome || 0,

        walletBalance: wallet?.balance || user.incomeWallet || 0
      },

      /* ===== TEAM SUMMARY ===== */

      team: {
        directTeam,
        totalTeam: allTeam.length,
        activeTeam,
        inactiveTeam,
        incentiveTeam: {
          active: incentiveActive,
          inactive: incentiveInactive
        },
        bonusTeam: {
          active: bonusActive,
          inactive: bonusInactive
        }
      }

    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getAccountSummary = async (req, res) => {
  try {

    const userId = req.user._id;

    const user = await User.findById(userId);
    const wallet = await Wallet.findOne({ user: userId });

    // ================= TEAM =================

    const directTeam = await User.countDocuments({
      parentId: userId
    });

    const allTeam = await getAllDownline(userId);

    const leftTeam = allTeam.filter(
      u => u.position === "LEFT"
    );

    const rightTeam = allTeam.filter(
      u => u.position === "RIGHT"
    );

    const activeTeam = allTeam.filter(
      u => u.isActive
    ).length;

    const inactiveTeam = allTeam.length - activeTeam;

    const bonusActive = leftTeam.filter(
      u => u.isActive
    ).length;

    const bonusInactive =
      leftTeam.length - bonusActive;

    const incentiveActive = rightTeam.filter(
      u => u.isActive
    ).length;

    const incentiveInactive =
      rightTeam.length - incentiveActive;

    res.json({
      profile: {
        fullName: user.fullName,
        uniqueId: user.uniqueId,
        currentRank: user.currentRank,
        isActive: user.isActive,
      },
      income: {

        totalIncome:
          user.lifetimeTotalIncome || 0,

        weeklyIncome:
          user.lifetimeWeeklyIncome || 0,
        repurchaseIncome: user.lifetimeRepurchaseIncome || 0,

        monthlyIncome:
          user.lifetimeMonthlyIncome || 0,

        royaltyIncome:
          user.lifetimeRoyaltyIncome || 0,

        thirdLegIncome:
          user.lifetimeThirdLegIncome || 0,

        levelRewardIncome:
          user.lifetimeLevelRewardIncome || 0,

        walletBalance:
          wallet?.balance ||
          user.incomeWallet ||
          0
      },

      team: {

        directTeam,

        totalTeam: allTeam.length,

        activeTeam,

        inactiveTeam,

        bonusActive,

        bonusInactive,

        incentiveActive,

        incentiveInactive

      }

    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }
};


exports.getIdCard = async (req, res) => {
  try {

    const user = await User.findById(req.user._id)
      .select("fullName uniqueId mobile photo kycDocs kycStatus shippingAddress");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
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
      kyc: user.kycDocs,
      kycStatus: user.kycStatus,
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

    // Cloudinary URL save karo
    user.photo = req.file.path;

    await user.save();

    res.json({
      msg: "Photo updated successfully",
      photo: user.photo,
    });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(`
      franchiseName
      franchiseOwnerName
      fullName
      email
      mobile
      fatherName
      gender
      dob
      location
      shippingAddress
      photo
      uniqueId
      isActive
    `);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json({
      profile: {
        franchiseName: user.franchiseName || "",
        franchiseOwnerName: user.franchiseOwnerName || "",
        fullName: user.fullName || "",
        referralId: user.uniqueId,

        mobile: user.mobile || "",
        email: user.email || "",

        fatherName: user.fatherName || "",
        gender: user.gender || "",
        dob: user.dob || "",

        pincode: user.location?.pincode || "",
        district: user.location?.district || "",
        state: user.location?.state || "",
        address: `${user.location?.village || ""} ${user.location?.block || ""}`.trim(),

        shippingAddress: user.shippingAddress || {},
        photo: user.photo || "",

        status: user.isActive ? "Active" : "Inactive"
      }
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};
