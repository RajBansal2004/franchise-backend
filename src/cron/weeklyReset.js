const cron = require("node-cron");
const User = require("../models/User");
const Settings = require("../models/Settings");
const weeklyClosing = require("../utils/weeklyClosing");
cron.schedule(
  "* * * * *",
  async () => {
    try {
      let settings = await Settings.findOne();

      if (!settings) {
        settings = await Settings.create({});
      }

      if (settings.weeklyClosingMode !== "AUTO") return;

      const now = new Date();

      // Day check
      const currentDay = now.getDay(); // Sunday=0

      if (currentDay !== settings.weeklyClosingDay) return;

      // Time check
      const currentTime =
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      if (currentTime !== settings.weeklyClosingTime) return;

      // Already executed today
      if (
        settings.lastWeeklyClosing &&
        settings.lastWeeklyClosing.toDateString() === now.toDateString()
      ) {
        return;
      }

      console.log("🚀 Weekly Closing Started");
      // STEP 1
      await weeklyClosing();

      settings.lastWeeklyClosing = now;

      await settings.save();

      console.log("✅ Weekly Closing Completed");
    } catch (err) {
      console.error(err);
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);