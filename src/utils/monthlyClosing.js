const User = require("../models/User");
const Settings = require("../models/Settings");
const calculateMonthlyIncome = require("./monthlyIncome");

module.exports = async function monthlyClosing() {

    console.log("🚀 Monthly Closing Started");

    await calculateMonthlyIncome();

    await User.updateMany(
        {},
        {
            $set: {
                monthlyLeftBP: 0,
                monthlyRightBP: 0,
            }
        }
    );

    await Settings.updateOne(
        {},
        {
            lastMonthlyClosing: new Date()
        }
    );

    console.log("✅ Monthly Closing Completed");

};