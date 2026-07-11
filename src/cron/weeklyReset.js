const cron = require("node-cron");

const Settings = require("../models/Settings");

const weeklyClosing = require("../utils/weeklyClosing");
const monthlyClosing = require("../utils/monthlyClosing");

cron.schedule("* * * * *", async () => {

    try {

        const settings = await Settings.findOne();

        if (!settings) return;

        const now = new Date();

        const currentTime =
            `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

        const currentDay = now.getDay();

        /* ===========================
                WEEKLY AUTO
        ============================ */

        if (
            settings.weeklyClosingEnabled &&
            settings.weeklyClosingMode === "AUTO"
        ) {

            const alreadyExecuted =
                settings.lastWeeklyClosing &&
                settings.lastWeeklyClosing.toDateString() === now.toDateString();

            if (
                !alreadyExecuted &&
                currentDay === settings.weeklyClosingDay &&
                currentTime === settings.weeklyClosingTime
            ) {

                console.log("🚀 AUTO WEEKLY CLOSING STARTED");

                await weeklyClosing();

                settings.lastWeeklyClosing = new Date();

                await settings.save();

                console.log("✅ AUTO WEEKLY CLOSING COMPLETED");

            }

        }

        /* ===========================
                MONTHLY AUTO
        ============================ */

        if (
            settings.monthlyClosingEnabled &&
            settings.monthlyClosingMode === "AUTO"
        ) {

            let execute = false;

            if (settings.monthlyClosingDate === "LAST") {

                const tomorrow = new Date(now);

                tomorrow.setDate(now.getDate() + 1);

                if (tomorrow.getMonth() !== now.getMonth()) {
                    execute = true;
                }

            }

            else {

                execute =
                    Number(settings.monthlyClosingDate) === now.getDate();

            }

            const alreadyExecuted =
                settings.lastMonthlyClosing &&
                settings.lastMonthlyClosing.toDateString() === now.toDateString();

            if (
                execute &&
                !alreadyExecuted &&
                currentTime === settings.monthlyClosingTime
            ) {

                console.log("🚀 AUTO MONTHLY CLOSING STARTED");

                await monthlyClosing();

                settings.lastMonthlyClosing = new Date();

                await settings.save();

                console.log("✅ AUTO MONTHLY CLOSING COMPLETED");

            }

        }

    }

    catch (err) {

        console.error("CRON ERROR :", err);

    }

},
{
    timezone: "Asia/Kolkata"
});