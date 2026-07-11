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
                continue;
            }

            const pair = Math.floor(matchedBP / 50);

            let income = pair * 500;
            console.log({
                pair,
                income,
                totalIncome: user.totalIncome,
                activationBP: user.activationBP
            });
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
                console.log("========== USER ==========");
                console.log("User :", user.uniqueId);
                console.log("Left BP :", left);
                console.log("Right BP :", right);
                console.log("Matched BP :", matchedBP);
                console.log("Pair :", pair);
                console.log("Income :", income);


                try {
                    console.log("Creating Debit...");

                    const debit = await Debit.create({

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

                    console.log("✅ Debit Saved :", debit._id);

                } catch (err) {

                    console.error("❌ Debit Create Error:", err);

                }

            }

            console.log("Debit Created Successfully :", user.uniqueId);
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