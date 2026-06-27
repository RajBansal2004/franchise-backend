const User = require("../models/User");

module.exports = async function thirdLegIncome(userId) {

    const user = await User.findById(userId);

    if (!user) return;
    if (!user.isActive) return;

    const bp = user.thirdLegBP || 0;

    const pair = Math.floor(bp / 50);

    if (pair <= 0) return;

    const usedBP = pair * 50;

    let income = pair * 500;

    // Income Cap
    let cap = 0;

    if (user.activationBP === 51)
        cap = 100000;
    else if (user.activationBP === 101)
        cap = 150000;

    if (cap && user.totalIncome >= cap)
        return;

    if (cap && user.totalIncome + income > cap) {
        income = cap - user.totalIncome;
    }

    if (income <= 0)
        return;

    user.thirdLegIncome =
        (user.thirdLegIncome || 0) + income;

    user.lifetimeThirdLegIncome =
        (user.lifetimeThirdLegIncome || 0) + income;

    user.totalIncome += income;

    user.lifetimeTotalIncome =
        (user.lifetimeTotalIncome || 0) + income;

    user.incomeWallet += income;

    user.thirdLegBP =
        Math.max(0, user.thirdLegBP - usedBP);

    await user.save();

}