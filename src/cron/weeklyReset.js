const cron = require('node-cron');
const User = require('../models/User');
const matchingIncome = require('../utils/matchingIncome');

cron.schedule('0 0 * * 0', async () => {
  console.log("🔄 Weekly Processing Started");

  const users = await User.find();

  for (let user of users) {
    await matchingIncome(user._id);

    user.weeklyLeftBP = 0;
    user.weeklyRightBP = 0;
    user.weeklyIncome = 0;
    user.lastWeeklyPaidAt = null;

    await user.save();
  }

  console.log("✅ Weekly Processing Done");
});