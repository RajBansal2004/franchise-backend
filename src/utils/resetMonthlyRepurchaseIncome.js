const User = require("../models/User");

module.exports = async function resetMonthlyRepurchaseIncome() {

    await User.updateMany(
        {
            isActive: true,
            role: { $ne: "ADMIN" }
        },
        {
            $set: {
                monthlyRepurchaseIncome: 0
            }
        }
    );

    console.log("✅ Monthly Repurchase Income Reset Completed");

};