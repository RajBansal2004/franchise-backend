const User = require("../models/User");

module.exports = async function resetWeeklyIncome() {

    await User.updateMany(
        {
            isActive: true,
            role: { $ne: "ADMIN" }
        },
        {
            $set: {
                weeklyIncome: 0
            }
        }
    );
    console.log("reset bp hai-----",result);
    console.log("✅ Weekly Income Reset Completed");

};