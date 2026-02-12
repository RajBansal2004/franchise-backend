const User = require('../models/User');
const matchingIncome = require('../utils/matchingIncome');
const checkLevels = require('../utils/levelChecker');
const rewardEngine = require('../utils/rewardEngine');
const calculateRoyalty = require('../utils/royaltyEngine');


module.exports = async function runMatchingCron() {

  console.log('🔁 Matching Income Cron Started');

  const users = await User.find({
    isActive: true,
    kycStatus: 'approved'
  });

  for (const user of users) {

    await matchingIncome(user._id);

    await checkLevels(user);
    rewardEngine(user);

    await calculateRoyalty(user);  // ✅ user object pass karo

    await user.save();
  }

  console.log('✅ Matching Income Cron Completed');
};

