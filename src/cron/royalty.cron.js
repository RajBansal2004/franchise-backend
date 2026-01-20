const User = require('../models/User');
const calculateRoyalty = require('../utils/royaltyEngine');

module.exports = async function runRoyaltyCron() {
//   console.log('🔁 Royalty Cron Started');

  // 🔥 example turnover (real me order collection se niklega)
  const companyTurnover = 10000000; // 1 Cr

  const users = await User.find({
    isActive: true,
    level: { $gte: 5 }
  });

  for (const user of users) {
    const income = calculateRoyalty(user, companyTurnover);
    if (income > 0) await user.save();
  }

//   console.log('✅ Royalty Cron Completed');
};
