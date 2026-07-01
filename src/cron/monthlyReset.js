const cron = require("node-cron");
const User = require("../models/User");
const Settings = require("../models/Settings");
const calculateMonthlyIncome = require("../utils/monthlyIncome");

cron.schedule(
  "59 23 28-31 * *",
  async () => {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      // Only last day of month
      if (tomorrow.getMonth() === today.getMonth()) {
        return;
      }

      let settings = await Settings.findOne();

      if (!settings) {
        settings = await Settings.create({});
      }

      if (settings.monthlyClosingMode !== "AUTO") {
        console.log("⏸ Monthly Closing skipped (MANUAL mode)");
        return;
      }

      // Already executed today
      if (
        settings.lastMonthlyClosing &&
        settings.lastMonthlyClosing.toDateString() === today.toDateString()
      ) {
        console.log("⚠ Monthly Closing already executed.");
        return;
      }

      console.log("🚀 Monthly Closing Started");

      await calculateMonthlyIncome();

      await User.updateMany(
        {},
        {
          $set: {
            monthlyLeftBP: 0,
            monthlyRightBP: 0,
            monthlyIncome: 0,
          },
        }
      );

      settings.lastMonthlyClosing = new Date();
      await settings.save();

      console.log("✅ Monthly Closing Completed");
    } catch (err) {
      console.error("❌ Monthly Closing Error:", err);
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);