const cron = require('node-cron');
const User = require('../models/User');

cron.schedule(
  '0 0 * * 3',
  async () => {

    try {

      console.log("🔄 Weekly Closing Started");

      await User.updateMany(
        {},
        {
          $set: {
            weeklyLeftBP: 0,
            weeklyRightBP: 0
          }
        }
      );

      console.log("✅ Weekly Closing Completed");

    } catch (err) {

      console.log("❌ Weekly Closing Error:", err.message);

    }

  },
  {
    timezone: "Asia/Kolkata"
  }
);