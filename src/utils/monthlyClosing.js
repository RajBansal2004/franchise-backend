const User = require("../models/User");
const Settings = require("../models/Settings");
const calculateMonthlyIncome = require("./monthlyIncome");

module.exports = async function monthlyClosing() {

    console.log("🚀 Monthly Closing Started");

    // 1. Monthly Income Calculate
    await calculateMonthlyIncome();

    // 2. Royalty Grace Time (24 Hours)
    const graceTime = new Date(
        Date.now() + 24 * 60 * 60 * 1000
    );

    // 3. Reset Monthly Data
    await User.updateMany(
        {},
        {
            $set: {
                monthlyLeftBP: 0,
                monthlyRightBP: 0,
                monthlyIncome: 0,
                monthlyRepurchaseIncome: 0,
                royaltyGraceUntil: graceTime
            }
        }
    );

    // 4. Save Closing Time
    await Settings.updateOne(
        {},
        {
            lastMonthlyClosing: new Date()
        }
    );

    console.log("✅ Monthly Closing Completed");

};