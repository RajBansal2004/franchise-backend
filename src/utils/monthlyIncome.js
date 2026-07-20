const User = require("../models/User");
const levels = require("../config/levels");
const Order = require("../models/Order");
const Debit = require("../models/Debit");
const applyIncome = require("./applyIncome");
const checkRepurchaseEligibility = require("./checkRepurchaseEligibility");
const calculateStepPending = require("../utils/stepPendingCalculator");
module.exports = async function calculateMonthlyIncome() {

    const users = await User.find();

    const now = new Date();

    for (const user of users) {
        let monthlyProcessed = false;
        // Prevent duplicate monthly closing
        if (
            user.lastMonthlyPaidAt &&
            new Date(user.lastMonthlyPaidAt).getMonth() === now.getMonth() &&
            new Date(user.lastMonthlyPaidAt).getFullYear() === now.getFullYear()
        ) {
            continue;
        }

        // ============================================
        // Monthly Level Bonus
        // ============================================

        const stepData = calculateStepPending(user);

        const eligibleLevel = stepData.completed;

        const currentLevel = levels.find(
            level => level.level === eligibleLevel
        );

        await checkRepurchaseEligibility(user);
        let alreadyPaid = null;

        if (currentLevel) {

            const monthStart = new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            );

            const monthEnd = new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                1
            );

            alreadyPaid = await Debit.findOne({

                loginId: user.uniqueId,

                subType: "LEVEL_BONUS",

                level: currentLevel.level,

                date: {
                    $gte: monthStart,
                    $lt: monthEnd
                }

            });

        }

        if (currentLevel && !alreadyPaid) {

            const payableMonthlyIncome = applyIncome(

                user,

                currentLevel.monthlyBonus,
            );

            if (payableMonthlyIncome > 0) {

                if (user.isIncomeFrozen) {

                    console.log(`🔒 Monthly Income Frozen : ${user.uniqueId}`);

                    // Pending sirf ek baar add hoga
                    if (user.pendingMonthlyIncome <= 0) {

                        user.pendingMonthlyIncome = payableMonthlyIncome;

                    }

                }
                else {

                    // Director Bonus Category

                    if (eligibleLevel >= 1 && eligibleLevel <= 4) {

                        user.associateBonusIncome += payableMonthlyIncome;
                        user.lifetimeAssociateBonusIncome += payableMonthlyIncome;

                    }

                    else if (eligibleLevel >= 5 && eligibleLevel <= 8) {

                        user.regionalDirectorBonusIncome += payableMonthlyIncome;
                        user.lifetimeRegionalDirectorBonusIncome += payableMonthlyIncome;

                    }

                    else if (eligibleLevel >= 9 && eligibleLevel <= 12) {

                        user.stateDirectorBonusIncome += payableMonthlyIncome;
                        user.lifetimeStateDirectorBonusIncome += payableMonthlyIncome;

                    }

                    else if (eligibleLevel >= 13 && eligibleLevel <= 14) {

                        user.nationalDirectorBonusIncome += payableMonthlyIncome;
                        user.lifetimeNationalDirectorBonusIncome += payableMonthlyIncome;

                    }

                    else if (eligibleLevel === 15) {

                        user.internationalDirectorBonusIncome += payableMonthlyIncome;
                        user.lifetimeInternationalDirectorBonusIncome += payableMonthlyIncome;

                    }
                    user.monthlyIncome += payableMonthlyIncome;

                    user.lifetimeMonthlyIncome += payableMonthlyIncome;

                    user.totalIncome += payableMonthlyIncome;

                    user.lifetimeTotalIncome += payableMonthlyIncome;

                    user.incomeWallet += payableMonthlyIncome;

                    await Debit.create({

                        type: "USER",

                        subType: "LEVEL_BONUS",

                        level: currentLevel.level,

                        name: user.fullName,
                        loginId: user.uniqueId,
                        mobile: user.mobile,
                        amount: payableMonthlyIncome,
                        minusTds: 0,
                        minusMaintenance: 0,
                        finalAmount: payableMonthlyIncome,
                        description: `${currentLevel.rank} Level Bonus`,

                        date: now

                    });
                    monthlyProcessed = true;

                }

            }

        }

        // ============================================
        // Franchise Retail Profit
        // ============================================

        if (user.role === "FRANCHISE") {

            const startDate = user.lastMonthlyClosing || new Date(0);
            const result = await Order.aggregate([

                {
                    $match: {

                        franchiseId: user._id,

                        saleType: "FRANCHISE_SALE",

                        paymentStatus: "paid",

                        status: "approved",

                        monthlyClosingDone: false,

                        approvedAt: {

                            $gt: startDate,

                            $lte: now

                        }

                    }

                },

                {
                    $group: {

                        _id: null,

                        retailProfit: {

                            $sum: "$retailProfit"

                        }

                    }

                }

            ]);

            const retailProfit = result[0]?.retailProfit || 0;

            if (retailProfit > 0) {

                const payableRetailProfit = applyIncome(

                    user,

                    retailProfit,

                );

                if (payableRetailProfit > 0) {

                    await Debit.create({

                        type: "FRANCHISE",

                        subType: "MONTHLY_RETAIL_PROFIT",

                        name: user.fullName,

                        loginId: user.uniqueId,

                        mobile: user.mobile,

                        amount: payableRetailProfit,

                        minusTds: 0,

                        minusMaintenance: 0,

                        finalAmount: payableRetailProfit,

                        description: `Monthly Retail Profit - ${now.toLocaleString(
                            "default",
                            {
                                month: "long"
                            }
                        )} ${now.getFullYear()}`,

                        date: now

                    });
                    monthlyProcessed = true;

                }

                // Mark all orders as processed
                await Order.updateMany(

                    {

                        franchiseId: user._id,

                        saleType: "FRANCHISE_SALE",

                        paymentStatus: "paid",

                        status: "approved",

                        monthlyClosingDone: false,

                        approvedAt: {

                            $gt: startDate,

                            $lte: now

                        }

                    },

                    {

                        $set: {

                            monthlyClosingDone: true,

                            monthlyClosingDate: now

                        }

                    }

                );

            }

            user.lastMonthlyClosing = now;

        }

        if (monthlyProcessed) {

            user.lastMonthlyPaidAt = now;
        }
        await user.save();

    }

};