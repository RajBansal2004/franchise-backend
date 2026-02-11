const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { countLevelMembers } = require('../utils/levelCounter');
const calculateStepPending = require('../utils/stepPendingCalculator');
const Product = require('../models/Product');
const checkLevels = require('../utils/levelChecker');


const ROYALTY_MAP = {
  5: 1, 6: 2, 7: 3, 8: 4, 9: 5,
  10: 6, 11: 7, 12: 8, 13: 10,
  14: 12, 15: 15
};

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
    const user = req.user;

    let levels = [];

    for (let level = 5; level <= 15; level++) {
      let members = 0;

      try {
        members = await countLevelMembers(user._id, level);
      } catch (e) {
        console.error(`Level ${level} error:`, e.message);
      }

      levels.push({
        level,
        members,
        percentage: ROYALTY_MAP[level],
        eligible: members > 0
      });
    }

    res.json({
      totalIncome: user.totalIncome || 0,
      monthlyIncome: user.monthlyIncome || 0,
      wallet: user.incomeWallet || 0,
      levels
    });

  } catch (err) {
    console.error("ROYALTY API CRASH:", err);
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
        name:user.fullName,
        dsId:user.uniqueId,
        status:user.isActive ? 'Active' : 'Inactive',
        photo:user.photo,
        shippingAddress:user.shippingAddress
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




exports.updateProfile = async(req,res)=>{
 try{

  const { shippingAddress, photo } = req.body;

  const user = await User.findByIdAndUpdate(
   req.user.id,
   { shippingAddress, photo },
   { new:true }
  );

  res.json(user);

 }catch(err){
  res.status(500).json({msg:"Profile update error"});
 }
};


exports.getIdCard = async(req,res)=>{
 try{

  const kyc = await Kyc.findOne({user:req.user.id});

  res.json(kyc);

 }catch(err){
  res.status(500).json({msg:"ID card fetch error"});
 }
};
