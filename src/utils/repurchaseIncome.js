const User = require("../models/User");

module.exports = async function repurchaseIncome(userId) {

    const user = await User.findById(userId);

    if (!user) return;

    if (!user.isActive) return;

    const leftBP = user.repurchaseLeftBP || 0;
    const rightBP = user.repurchaseRightBP || 0;

    const matchedBP = Math.min(leftBP, rightBP);

    const pair = Math.floor(matchedBP / 50);

    if (pair <= 0) return;

    let income = pair * 500;

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

    const usedBP = pair * 50;

    user.repurchaseIncome =
        (user.repurchaseIncome || 0) + income;

    user.lifetimeRepurchaseIncome =
        (user.lifetimeRepurchaseIncome || 0) + income;

    user.totalIncome += income;

    user.lifetimeTotalIncome =
        (user.lifetimeTotalIncome || 0) + income;

    user.incomeWallet += income;

    user.repurchaseLeftBP =
        Math.max(0, user.repurchaseLeftBP - usedBP);

    user.repurchaseRightBP =
        Math.max(0, user.repurchaseRightBP - usedBP);

    await user.save();

};