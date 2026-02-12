const cron = require('node-cron');
const User = require('../models/User');

const startMonthlyReset = () => {

  // 🔥 Every month 1st date at 12:00 AM
  cron.schedule('0 0 1 * *', async () => {

    console.log("🔄 Monthly Reset Started");

    try {

      await User.updateMany(
        {},
        {
          $set: {
            monthlyLeftBP: 0,
            monthlyRightBP: 0,
            monthlyIncome: 0,
            royaltyIncome: 0
          }
        }
      );

      console.log("✅ Monthly Reset Completed");

    } catch (err) {
      console.error("❌ Monthly Reset Error:", err);
    }

  });

};

module.exports = startMonthlyReset;
