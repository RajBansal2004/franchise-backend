const cron = require("node-cron");

const Settings = require("../models/Settings");
const resetWeeklyIncome = require("../utils/resetWeeklyIncome");

// Har 5 minute me check karega
cron.schedule("*/5 * * * *", async () => {

    try {

        const settings = await Settings.findOne();

        if (!settings) return;

        if (!settings.weeklyIncomeResetAt) return;

        const now = new Date();

        if (now >= settings.weeklyIncomeResetAt) {

            console.log("🚀 Reset Weekly Income Started");

            await resetWeeklyIncome();

            settings.weeklyIncomeResetAt = null;

            await settings.save();

            console.log("✅ Weekly Income Reset Completed");

        }

    } catch (err) {

        console.error("Weekly Income Reset Cron Error:", err);

    }

});