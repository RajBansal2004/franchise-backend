const cron = require("node-cron");
const User = require("../models/User");
const Settings = require("../models/Settings");
const calculateMonthlyIncome = require("../utils/monthlyIncome");

cron.schedule(
  "* * * * *",
  async () => {
    try {
      let settings = await Settings.findOne();

      if (!settings) {
        settings = await Settings.create({});
      }

      if (settings.monthlyClosingMode !== "AUTO") return;

      const now = new Date();

      // Current Time
      const currentTime =
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      if (currentTime !== settings.monthlyClosingTime) return;

      let allowClosing = false;

      // Last Day option
      if (settings.monthlyClosingDate === "LAST") {

        const tomorrow = new Date(now);

        tomorrow.setDate(now.getDate() + 1);

        if (tomorrow.getMonth() !== now.getMonth()) {
          allowClosing = true;
        }

      } else {

        if (Number(settings.monthlyClosingDate) === now.getDate()) {
          allowClosing = true;
        }

      }

      if (!allowClosing) return;

      // Already executed today
      if (
        settings.lastMonthlyClosing &&
        settings.lastMonthlyClosing.toDateString() === now.toDateString()
      ) {
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

      settings.lastMonthlyClosing = now;

      await settings.save();

      console.log("✅ Monthly Closing Completed");
    } catch (err) {
      console.error(err);
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);