const User = require("../models/User");
const Debit = require("../models/Debit");

module.exports = async function weeklyClosing() {

    const users = await User.find({
        isActive: true
    });

    const now = new Date();

    for (const user of users) {

        const left = user.weeklyLeftBP || 0;
        const right = user.weeklyRightBP || 0;

        const matchedBP = Math.min(left, right);

        if (matchedBP < 50) {

            user.weeklyIncome = 0;

            continue;
        }

        const pair = Math.floor(matchedBP / 50);

        let income = pair * 500;

        let cap = Infinity;

        if (user.activationBP === 51)
            cap = 100000;

        if (user.activationBP === 101)
            cap = 150000;

        if (user.totalIncome >= cap) {

            income = 0;

        }

        else if (user.totalIncome + income > cap) {

            income = cap - user.totalIncome;

        }

        const usedBP = pair * 50;

        const leftBalance = left - usedBP;

        const rightBalance = right - usedBP;

        if (income > 0) {

            user.weeklyIncome += income;

            user.totalIncome += income;

            user.incomeWallet += income;

            user.lifetimeWeeklyIncome += income;

            user.lifetimeTotalIncome += income;

            await Debit.create({

                type: "USER",

                subType: "WEEKLY_MATCHING",

                name: user.fullName,

                loginId: user.uniqueId,

                mobile: user.mobile,

                amount: income,

                minusTds: 0,

                minusMaintenance: 0,

                finalAmount: income,

                description: `Weekly Matching Income (${pair} Pair)`,

                date: now

            });

        }

        user.weeklyLeftBP = leftBalance;

        user.weeklyRightBP = rightBalance;

        user.lastWeeklyPaidAt = now;

        await user.save();

    }

}