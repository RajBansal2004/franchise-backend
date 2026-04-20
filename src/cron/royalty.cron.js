const cron = require('node-cron');
const User = require('../models/User');
const calculateRoyalty = require('../utils/royaltyEngine');

cron.schedule('0 0 1 * *', async () => {

  console.log("🔥 Royalty Distribution Running...");

  const users = await User.find({
    isActive: true,
    kycStatus: 'approved'
  });

  for (const user of users) {

    await calculateRoyalty(user._id);

    // ✅ RESET MONTHLY BP AFTER ROYALTY
    user.monthlyLeftBP = 0;
    user.monthlyRightBP = 0;

    await user.save();
  }

  console.log("✅ Royalty + Reset Done");

}, {
  timezone: "Asia/Kolkata"
});