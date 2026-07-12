const Order = require("../models/Order");
const repurchaseRules = require("../config/repurchaseRules");

module.exports = async function checkRepurchaseEligibility(user) {

    const requiredBP = repurchaseRules[user.level] || 0;

    // Level 0 users ke liye koi rule nahi
    if (requiredBP === 0) {

        user.isIncomeFrozen = false;

        user.requiredRepurchaseBP = 0;

        return true;

    }

    const now = new Date();

    const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
        0,
        0,
        0
    );

    const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59
    );

    const result = await Order.aggregate([
        {
            $match: {

                user: user._id,

                orderFrom: "USER",

                saleType: {
                    $in: ["COMPANY_ORDER", "REPURCHASE"]
                },

                paymentStatus: "paid",

                status: "approved",

                approvedAt: {
                    $gte: startOfMonth,
                    $lte: endOfMonth
                }

            }
        },

        {
            $group: {
                _id: null,

                totalBP: {
                    $sum: "$totalBP"
                }
            }
        }

    ]);

    const repurchaseBP = result[0]?.totalBP || 0;

    user.requiredRepurchaseBP = requiredBP;

    user.lastRepurchaseBP = repurchaseBP;

    if (repurchaseBP >= requiredBP) {

        user.isIncomeFrozen = false;

        user.lastRepurchaseAt = now;

        return true;

    }

    user.isIncomeFrozen = true;

    return false;

};