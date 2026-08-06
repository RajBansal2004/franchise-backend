const User = require("../models/User");

module.exports = async function resetWeeklyIncome() {

    const result = await User.updateMany(
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

    console.log("Reset Result:", result);
    console.log("✅ Weekly Income Reset Completed");
};