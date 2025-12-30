const User = require('../models/User');
const Wallet = require('../models/Wallet');

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
