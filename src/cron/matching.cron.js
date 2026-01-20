const User = require('../models/User');
const matchingIncome = require('../utils/matchingIncome');
const checkLevels = require('../utils/levelChecker');
const rewardEngine = require('../utils/rewardEngine');

module.exports = async function runMatchingCron() {
  console.log('🔁 Matching Income Cron Started');

  const users = await User.find({
    isActive: true,
    kycStatus: 'approved'
  });

  for (const user of users) {
    const income = matchingIncome(user);

    if (income > 0) {
      await checkLevels(user);
      rewardEngine(user);
      await user.save();
    }
  }

  console.log('✅ Matching Income Cron Completed');
};
