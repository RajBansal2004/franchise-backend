const User = require("../models/User");
const Debit = require("../models/Debit");
const checkRepurchaseEligibility = require("./checkRepurchaseEligibility");

const PAIR_BP = 50;
const PAIR_INCOME = 500;

function getIncomeCap(user) {
    switch (user.activationBP) {
        case 51:
            return 100000;

        case 101:
            return 150000;

        default:
            return Infinity;
    }
}


function calculateIncome(user, pair) {

    const grossIncome = pair * PAIR_INCOME;
    const cap = getIncomeCap(user);

    if (user.totalIncome >= cap) {
        return 0;
    }

    if (user.totalIncome + grossIncome > cap) {
        return cap - user.totalIncome;
    }

    return grossIncome;
}


function consumeLeftBP(user, usedBP) {

    let remaining = usedBP;

    if (user.weeklyLeftBP >= remaining) {

        user.weeklyLeftBP -= remaining;
        return;

    }

    remaining -= user.weeklyLeftBP;
    user.weeklyLeftBP = 0;

    user.repurchaseLeftBP = Math.max(
        0,
        (user.repurchaseLeftBP || 0) - remaining
    );
}


function consumeRightBP(user, usedBP) {

    let remaining = usedBP;

    if (user.weeklyRightBP >= remaining) {

        user.weeklyRightBP -= remaining;
        return;

    }

    remaining -= user.weeklyRightBP;
    user.weeklyRightBP = 0;

    user.repurchaseRightBP = Math.max(
        0,
        (user.repurchaseRightBP || 0) - remaining
    );
}


async function createDebit(user, income, pair, now) {

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


async function creditIncome(user, income, pair, now) {

    user.weeklyIncome += income;
    user.totalIncome += income;
    user.incomeWallet += income;

    user.lifetimeWeeklyIncome += income;
    user.lifetimeTotalIncome += income;

    await createDebit(user, income, pair, now);
}


async function processUser(user, now) {

    const totalLeft =
        (user.weeklyLeftBP || 0) +
        (user.repurchaseLeftBP || 0);

    const totalRight =
        (user.weeklyRightBP || 0) +
        (user.repurchaseRightBP || 0);

    const matchedBP = Math.min(totalLeft, totalRight);

    if (matchedBP < PAIR_BP) {
        return;
    }

    const pair = Math.floor(matchedBP / PAIR_BP);

    if (pair <= 0) {
        return;
    }

    const income = calculateIncome(user, pair);

    if (income <= 0) {
        return;
    }

    const usedBP = pair * PAIR_BP;

    consumeLeftBP(user, usedBP);
    consumeRightBP(user, usedBP);

    await checkRepurchaseEligibility(user);

    if (user.isIncomeFrozen) {

        user.pendingWeeklyIncome += income;

        console.log(
            `🔒 Income Frozen : ${user.uniqueId} | Pending ₹${income}`
        );

    } else {

        await creditIncome(
            user,
            income,
            pair,
            now
        );

        console.log(
            `💰 ${user.uniqueId} | Pair=${pair} | Income=${income}`
        );
    }

    user.lastWeeklyPaidAt = now;

    await user.save({
        validateBeforeSave: false
    });
}


module.exports = async function weeklyClosing() {

    console.log("==========================================");
    console.log("🚀 WEEKLY CLOSING STARTED");
    console.log("==========================================");

    const users = await User.find({

        isActive: true,

        role: {
            $ne: "ADMIN"
        }

    });

    const now = new Date();

    let processed = 0;
    let failed = 0;

    for (const user of users) {

        try {

            await processUser(user, now);

            processed++;

        }

        catch (err) {

            failed++;

            console.error(
                `❌ ${user.uniqueId}`,
                err.message
            );
        }
    }

    console.log("==========================================");
    console.log("✅ WEEKLY CLOSING COMPLETED");
    console.log(`Processed : ${processed}`);
    console.log(`Failed    : ${failed}`);
    console.log("==========================================");
};