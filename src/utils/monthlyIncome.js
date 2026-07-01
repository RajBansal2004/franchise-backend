const User = require("../models/User");
const levels = require("../config/levels");
const Order = require("../models/Order");
const Debit = require("../models/Debit");
module.exports = async function calculateMonthlyIncome() {

    const users = await User.find();

    const now = new Date();

    for (const user of users) {

        if (
            user.lastMonthlyPaidAt &&
            new Date(user.lastMonthlyPaidAt).getMonth() === now.getMonth() &&
            new Date(user.lastMonthlyPaidAt).getFullYear() === now.getFullYear()
        ) {
            continue;
        }

        const currentLevel = levels.find(
            l => l.level === user.level
        );

        if (!currentLevel) continue;

        const income = currentLevel.monthlyBonus;

        user.monthlyIncome =
            (user.monthlyIncome || 0) + income;
        user.totalIncome += income;

        user.incomeWallet += income;

        user.lifetimeMonthlyIncome =
            (user.lifetimeMonthlyIncome || 0) + income;

        user.lifetimeTotalIncome =
            (user.lifetimeTotalIncome || 0) + income;

        if (user.level >= 1 && user.level <= 4) {

            user.associateBonusIncome =
                (user.associateBonusIncome || 0) + income;

            user.lifetimeAssociateBonusIncome =
                (user.lifetimeAssociateBonusIncome || 0) + income;

        }

        else if (user.level >= 5 && user.level <= 8) {

            user.regionalDirectorBonusIncome =
                (user.regionalDirectorBonusIncome || 0) + income;

            user.lifetimeRegionalDirectorBonusIncome =
                (user.lifetimeRegionalDirectorBonusIncome || 0) + income;

        }

        else if (user.level >= 9 && user.level <= 12) {

            user.stateDirectorBonusIncome =
                (user.stateDirectorBonusIncome || 0) + income;

            user.lifetimeStateDirectorBonusIncome =
                (user.lifetimeStateDirectorBonusIncome || 0) + income;

        }

        else if (user.level >= 13 && user.level <= 14) {

            user.nationalDirectorBonusIncome =
                (user.nationalDirectorBonusIncome || 0) + income;

            user.lifetimeNationalDirectorBonusIncome =
                (user.lifetimeNationalDirectorBonusIncome || 0) + income;

        }

        else if (user.level === 15) {

            user.internationalDirectorBonusIncome =
                (user.internationalDirectorBonusIncome || 0) + income;

            user.lifetimeInternationalDirectorBonusIncome =
                (user.lifetimeInternationalDirectorBonusIncome || 0) + income;

        }


        if (user.role === "FRANCHISE") {

            const startDate = user.lastMonthlyClosing || new Date(0);

            const result = await Order.aggregate([
                {
                    $match: {
                        franchiseId: user._id,
                        paymentStatus: "paid",
                        status: "approved",
                        saleType: "FRANCHISE_SALE",
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

                user.retailProfitIncome =
                    (user.retailProfitIncome || 0) + retailProfit;

                user.lifetimeRetailProfitIncome =
                    (user.lifetimeRetailProfitIncome || 0) + retailProfit;

                user.monthlyIncome =
                    (user.monthlyIncome || 0) + retailProfit;

                user.totalIncome =
                    (user.totalIncome || 0) + retailProfit;

                user.lifetimeTotalIncome =
                    (user.lifetimeTotalIncome || 0) + retailProfit;

                user.incomeWallet =
                    (user.incomeWallet || 0) + retailProfit;
                     await Debit.create({
                type: "FRANCHISE",
                subType: "MONTHLY_RETAIL_PROFIT",

                name: user.fullName,
                loginId: user.uniqueId,
                mobile: user.mobile,

                amount: retailProfit,

                minusTds: 0,
                minusMaintenance: 0,
                finalAmount: retailProfit,

                date: now
            });
             await Order.updateMany(
            {
                franchiseId: user._id,
                paymentStatus: "paid",
                status: "approved",
                saleType: "FRANCHISE_SALE",
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
                    user.lastMonthlyClosing = now;

            }

           
        }
       
        user.lastMonthlyPaidAt = now;

        await user.save();
    }
}