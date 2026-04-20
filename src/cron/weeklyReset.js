const cron = require('node-cron');
const User = require('../models/User');

cron.schedule('0 0 * * 0', async () => {
  console.log("🔄 Weekly Processing Started");

  const users = await User.find();

  for (let user of users) {
    user.weeklyLeftBP = 0;
    user.weeklyRightBP = 0;

    await user.save();
  }

  console.log("✅ Weekly Processing Done");
});