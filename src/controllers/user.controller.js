const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { countLevelMembers } = require('../utils/levelChecker');

const ROYALTY_MAP = {
  5: 1, 6: 2, 7: 3, 8: 4, 9: 5,
  10: 6, 11: 7, 12: 8, 13: 10,
  14: 12, 15: 15
};

exports.getRoyaltySummary = async (req, res) => {
  const user = await User.findById(req.user.id);

  let levels = [];

  for (let level = 5; level <= 15; level++) {
    const members = await countLevelMembers(user._id, level);

    levels.push({
      level,
      members,
      percentage: ROYALTY_MAP[level],
      eligible: members > 0
    });
  }

  res.json({
    totalIncome: user.totalIncome,
    monthlyIncome: user.monthlyIncome,
    wallet: user.incomeWallet,
    levels
  });
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
