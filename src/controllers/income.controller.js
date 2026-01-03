const User = require('../models/User');

const BINARY_INCOME = 500;
const FRANCHISE_COMMISSION = 200;

/* ===== Binary Income ===== */
exports.calculateBinaryIncome = async (userId) => {
  const user = await User.findById(userId);

  if (!user || user.isBlocked || user.kycStatus !== 'approved') return;

  if (user.leftUser && user.rightUser) {
    user.walletBalance += BINARY_INCOME;
    await user.save();
  }
};

/* ===== Franchise Commission ===== */
exports.addFranchiseCommission = async (franchiseId) => {
  const franchise = await User.findById(franchiseId);

  if (!franchise || franchise.isBlocked) return;

  franchise.walletBalance += FRANCHISE_COMMISSION;
  await franchise.save();
};
