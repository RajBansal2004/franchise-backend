const cron = require("node-cron");
const User = require("../models/User");
const Settings = require("../models/Settings");

cron.schedule(
  "0 0 * * 3",
  async () => {
    try {
      let settings = await Settings.findOne();

      if (!settings) {
        settings = await Settings.create({});
      }

      if (settings.weeklyClosingMode !== "AUTO") {
        console.log("⏸ Weekly Closing skipped (MANUAL mode)");
        return;
      }

      const today = new Date();

      if (
        settings.lastWeeklyClosing &&
        settings.lastWeeklyClosing.toDateString() === today.toDateString()
      ) {
        console.log("⚠ Weekly Closing already executed.");
        return;
      }

      console.log("🚀 Weekly Closing Started");

      await User.updateMany(
        {},
        {
          $set: {
            weeklyLeftBP: 0,
            weeklyRightBP: 0,
            weeklyIncome: 0,
          },
        }
      );

      settings.lastWeeklyClosing = new Date();

      await settings.save();

      console.log("✅ Weekly Closing Completed");
    } catch (err) {
      console.error("❌ Weekly Closing Error:", err);
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);