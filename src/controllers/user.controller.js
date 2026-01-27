const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { countLevelMembers } = require('../utils/levelCounter');
const calculateStepPending = require('../utils/stepPendingCalculator');
const ROYALTY_MAP = {
  5: 1, 6: 2, 7: 3, 8: 4, 9: 5,
  10: 6, 11: 7, 12: 8, 13: 10,
  14: 12, 15: 15
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

    const user = await User.findById(userId).select(
      'fullName uniqueId role kycStatus referralId createdAt'
    );

    const leftCount = await User.countDocuments({
      parentId: userId,
      position: 'LEFT'
    });

    const rightCount = await User.countDocuments({
      parentId: userId,
      position: 'RIGHT'
    });

    const totalReferrals = leftCount + rightCount;

    const wallet = await Wallet.findOne({ user: userId });

    res.json({
      profile: user,
      team: {
        left: leftCount,
        right: rightCount,
        total: totalReferrals
      },
      wallet: {
        balance: wallet?.balance || 0,
        totalIncome: wallet?.totalIncome || 0
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
