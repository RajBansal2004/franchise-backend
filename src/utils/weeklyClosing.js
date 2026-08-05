const User = require("../models/User");
const Debit = require("../models/Debit");
const checkRepurchaseEligibility = require("./checkRepurchaseEligibility");
module.exports = async function weeklyClosing() {

    const users = await User.find({
        isActive: true,
        role: { $ne: "ADMIN" }
    });

    const now = new Date();

    for (const user of users) {

        try {


            const activationMatchedBP = Math.min(
                user.weeklyLeftBP || 0,
                user.weeklyRightBP || 0
            );

            const activationPair = Math.floor(activationMatchedBP / 50);


            // ================= REPURCHASE MATCHING =================

            // const repurchaseMatchedBP = Math.min(
            //     user.repurchaseLeftBP || 0,
            //     user.repurchaseRightBP || 0
            // );

            // const repurchasePair = Math.floor(repurchaseMatchedBP / 50);
           
            // ================= TOTAL PAIR =================

            const pair = activationPair + repurchasePair;

            if (pair <= 0) {
                continue;
            }

            let income = pair * 500;

            let cap = Infinity;

            if (user.activationBP === 51)
                cap = 100000;

            if (user.activationBP === 101)
                cap = 150000;

            if (user.weeklyIncome >= cap) {

                income = 0;

            } else if (user.weeklyIncome + income > cap) {

                income = cap - user.weeklyIncome;

            }



            // ================= CONSUME ACTIVATION BP =================

            const usedActivationBP = activationPair * 50;

            user.weeklyLeftBP = Math.max(
                0,
                (user.weeklyLeftBP || 0) - usedActivationBP
            );

            user.weeklyRightBP = Math.max(
                0,
                (user.weeklyRightBP || 0) - usedActivationBP
            );


            // ================= CONSUME REPURCHASE BP =================

            // const usedRepurchaseBP = repurchasePair * 50;

            // user.repurchaseLeftBP = Math.max(
            //     0,
            //     (user.repurchaseLeftBP || 0) - usedRepurchaseBP
            // );

            // user.repurchaseRightBP = Math.max(
            //     0,
            //     (user.repurchaseRightBP || 0) - usedRepurchaseBP
            // );


            if (user.weeklyLeftBP < 0) user.weeklyLeftBP = 0;
            if (user.weeklyRightBP < 0) user.weeklyRightBP = 0;

            if (income > 0) {

                await checkRepurchaseEligibility(user);

                if (user.isIncomeFrozen) {
                    user.pendingWeeklyIncome += income;

                } else {

                    user.weeklyIncome += income;
                    user.totalIncome += income;
                    user.incomeWallet += income;
                    user.lifetimeWeeklyIncome += income;
                    user.lifetimeTotalIncome += income;

                    const debit = new Debit({

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

                    await debit.save();

                }

            }
            user.lastWeeklyPaidAt = now;

            await user.save({ validateBeforeSave: false });

        }
        catch (err) {

            console.log(err);

        }

    }

    console.log("Weekly Closing Completed");

};