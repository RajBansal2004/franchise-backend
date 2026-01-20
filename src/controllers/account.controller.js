exports.getAccount = async (req, res) => {
  const user = await User.findById(req.user.id);

  res.json({
    profile: {
      name: user.fullName,
      rank: user.currentRank,
      level: user.level
    },
    bp: {
      left: user.leftBP,
      right: user.rightBP,
      self: user.selfBP
    },
    wallet: {
      balance: user.incomeWallet,
      weekly: user.weeklyIncome,
      monthly: user.monthlyIncome,
      total: user.totalIncome
    },
    rewards: user.rewards,
    royalty: user.royaltyEligible
  });
};
