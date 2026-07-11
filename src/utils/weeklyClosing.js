const User = require("../models/User");
const Debit = require("../models/Debit");

module.exports = async function weeklyClosing() {

    const users = await User.find({
        isActive: true,
        role: { $ne: "ADMIN" }
    });

    const now = new Date();

    for (const user of users) {

        try {

            const left = user.weeklyLeftBP || 0;
            const right = user.weeklyRightBP || 0;

            const matchedBP = Math.min(left, right);

            if (matchedBP < 50) {

                user.weeklyIncome = 0;
                await user.save();
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
            } else if (user.totalIncome + income > cap) {
                income = cap - user.totalIncome;
            }

            const usedBP = pair * 50;

            user.weeklyLeftBP -= usedBP;
            user.weeklyRightBP -= usedBP;

            if (user.weeklyLeftBP < 0) user.weeklyLeftBP = 0;
            if (user.weeklyRightBP < 0) user.weeklyRightBP = 0;

            if (income > 0) {

                user.weeklyIncome += income;
                user.totalIncome += income;
                user.incomeWallet += income;
                user.lifetimeWeeklyIncome += income;
                user.lifetimeTotalIncome += income;

                const alreadyExists = await Debit.findOne({

                    loginId: user.uniqueId,

                    subType: "WEEKLY_MATCHING",

                    description: `Weekly Matching Income (${pair} Pair)`,

                    createdAt: {
                        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                        $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
                    }

                });

                if (!alreadyExists) {

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

            }

            user.lastWeeklyPaidAt = now;

            await user.save();

            console.log(
                `${user.uniqueId} | Pair=${pair} | Income=${income}`
            );

        }
        catch (err) {

            console.log(err);

        }

    }

    console.log("Weekly Closing Completed");

};