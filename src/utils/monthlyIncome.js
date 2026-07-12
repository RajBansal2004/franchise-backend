const User = require("../models/User");
const levels = require("../config/levels");
const Order = require("../models/Order");
const Debit = require("../models/Debit");
const applyIncome = require("./applyIncome");
const checkRepurchaseEligibility = require("./checkRepurchaseEligibility");
module.exports = async function calculateMonthlyIncome() {

    const users = await User.find();

    const now = new Date();

    for (const user of users) {

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

        const currentLevel = levels.find(
            level => level.level === user.level
        );
        await checkRepurchaseEligibility(user);

        if (currentLevel) {

            const payableMonthlyIncome = applyIncome(

                user,

                currentLevel.monthlyBonus,
            );

            if (payableMonthlyIncome > 0) {

                if (user.isIncomeFrozen) {

                    console.log(`🔒 Monthly Income Frozen : ${user.uniqueId}`);

                    user.pendingMonthlyIncome += payableMonthlyIncome;

                } else {

                    // Director Bonus Category

                    if (user.level >= 1 && user.level <= 4) {

                        user.associateBonusIncome += payableMonthlyIncome;
                        user.lifetimeAssociateBonusIncome += payableMonthlyIncome;

                    }

                    else if (user.level >= 5 && user.level <= 8) {

                        user.regionalDirectorBonusIncome += payableMonthlyIncome;
                        user.lifetimeRegionalDirectorBonusIncome += payableMonthlyIncome;

                    }

                    else if (user.level >= 9 && user.level <= 12) {

                        user.stateDirectorBonusIncome += payableMonthlyIncome;
                        user.lifetimeStateDirectorBonusIncome += payableMonthlyIncome;

                    }

                    else if (user.level >= 13 && user.level <= 14) {

                        user.nationalDirectorBonusIncome += payableMonthlyIncome;
                        user.lifetimeNationalDirectorBonusIncome += payableMonthlyIncome;

                    }

                    else if (user.level === 15) {

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

                        subType: "MONTHLY_BONUS",

                        name: user.fullName,

                        loginId: user.uniqueId,

                        mobile: user.mobile,

                        amount: payableMonthlyIncome,

                        minusTds: 0,

                        minusMaintenance: 0,

                        finalAmount: payableMonthlyIncome,

                        description: `Monthly Bonus Level ${user.level}`,

                        date: now

                    });

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

        user.lastMonthlyPaidAt = now;

        await user.save();

    }

};