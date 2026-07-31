const User = require("../models/User");
const Debit = require("../models/Debit");

module.exports = async function matchingIncome(userId, session) {

    // const user = await User.findById(userId).session(session);

    // if (!user) return;
    // if (!user.isActive) return;
    // if (user.role === "ADMIN") return;

    // // Total Available BP
    // const leftAvailable =
    //     (user.weeklyLeftBP || 0) +
    //     (user.repurchaseLeftBP || 0);

    // const rightAvailable =
    //     (user.weeklyRightBP || 0) +
    //     (user.repurchaseRightBP || 0);

    // const matchedBP = Math.min(leftAvailable, rightAvailable);

    // const pair = Math.floor(matchedBP / 50);

    // if (pair <= 0) return;

    // let income = pair * 500; // 50 BP = ₹500

    // let cap = Infinity;

    // if (user.activationBP === 51)
    //     cap = 100000;
    // else if (user.activationBP === 101)
    //     cap = 150000;

    // if (user.totalIncome >= cap) return;

    // if (user.totalIncome + income > cap) {
    //     income = cap - user.totalIncome;
    // }

    // if (income <= 0) return;

    // const usedBP = pair * 50;

    // // Income
    // user.weeklyIncome += income;
    // user.lifetimeWeeklyIncome += income;

    // user.totalIncome += income;
    // user.lifetimeTotalIncome += income;

    // user.incomeWallet += income;

    // // LEFT consume
    // let remaining = usedBP;

    // if (user.weeklyLeftBP >= remaining) {

    //     user.weeklyLeftBP -= remaining;

    // } else {

    //     remaining -= user.weeklyLeftBP;
    //     user.weeklyLeftBP = 0;

    //     user.repurchaseLeftBP = Math.max(
    //         0,
    //         user.repurchaseLeftBP - remaining
    //     );
    // }

    // // RIGHT consume
    // remaining = usedBP;

    // if (user.weeklyRightBP >= remaining) {

    //     user.weeklyRightBP -= remaining;

    // } else {

    //     remaining -= user.weeklyRightBP;
    //     user.weeklyRightBP = 0;

    //     user.repurchaseRightBP = Math.max(
    //         0,
    //         user.repurchaseRightBP - remaining
    //     );
    // }

    // user.lastWeeklyPaidAt = new Date();

    // await Debit.create([{
    //     type: "USER",
    //     subType: "WEEKLY_MATCHING",

    //     name: user.fullName,
    //     loginId: user.uniqueId,
    //     mobile: user.mobile,

    //     amount: income,

    //     minusTds: 0,
    //     minusMaintenance: 0,
    //     finalAmount: income,

    //     description: `Weekly Matching Income (${pair} Pair)`,

    //     date: new Date()

    // }], { session });

    // await user.save({ session });

};