const User = require("../models/User");
const Debit = require("../models/Debit");

function getDirectionForAncestor(ancestorPath, userPath) {

    if (!userPath.startsWith(ancestorPath)) {
        return null;
    }

    const remaining = userPath.slice(ancestorPath.length);

    if (!remaining.length) {
        return null;
    }

    return remaining[0] === "L"
        ? "LEFT"
        : "RIGHT";
}

module.exports = async function repurchaseIncome(startUserId, totalBP, session) {
    console.log("========== REPURCHASE START ==========");
    console.log("User:", startUserId.toString());
    console.log("BP:", totalBP);
    console.trace("Called From");
    const user = await User.findById(startUserId).session(session);

    if (!user) return;
    if (!user.isActive) return;
    if (user.role === "ADMIN") return;

    /* ==========================================
       SELF REPURCHASE INCOME
    ========================================== */

    const income = totalBP * 5;

  let cap = Infinity;

if (user.activationBP === 51) {
    cap = 100000;
} else if (user.activationBP === 101) {
    cap = 150000;
}

let payableIncome = income;

// Repurchase Income Cap (same as Weekly)
if ((user.monthlyRepurchaseIncome || 0) >= cap) {

    payableIncome = 0;

} else if ((user.monthlyRepurchaseIncome || 0) + income > cap) {

    payableIncome = cap - (user.monthlyRepurchaseIncome || 0);

}


    if (payableIncome > 0) {

        user.repurchaseIncome =
            (user.repurchaseIncome || 0) + payableIncome;

        user.monthlyRepurchaseIncome =
            (user.monthlyRepurchaseIncome || 0) + payableIncome;

        user.lifetimeRepurchaseIncome =
            (user.lifetimeRepurchaseIncome || 0) + payableIncome;

        user.totalIncome += payableIncome;
        user.lifetimeTotalIncome += payableIncome;

        user.incomeWallet += payableIncome;

        await Debit.create([{
            type: "USER",
            subType: "REPURCHASE",

            name: user.fullName,
            loginId: user.uniqueId,
            mobile: user.mobile,

            amount: payableIncome,

            minusTds: 0,
            minusMaintenance: 0,
            finalAmount: payableIncome,

            description: `Repurchase Income (${totalBP} BP)`,

            date: new Date()

        }], { session });

        await user.save({ session });
    }

    /* ==========================================
       REPURCHASE BP PROPAGATION
    ========================================== */

    let currentUser = user;

    while (currentUser.parentId) {

        const parent = await User.findById(currentUser.parentId)
            .session(session);

        if (!parent) break;

        if (parent.role === "ADMIN") break;

        const direction = getDirectionForAncestor(
            parent.path,
            user.path
        );

        if (!direction) {

            currentUser = parent;
            continue;
        }

        if (direction === "LEFT") {

            parent.repurchaseLeftBP =
                (parent.repurchaseLeftBP || 0) + totalBP;

        } else {

            parent.repurchaseRightBP =
                (parent.repurchaseRightBP || 0) + totalBP;
        }

        console.log(
            `Repurchase BP -> ${parent.uniqueId} | ${direction} | +${totalBP}`
        );
        console.log(
            `${parent.uniqueId}
LEFT=${parent.repurchaseLeftBP}
RIGHT=${parent.repurchaseRightBP}`
        );
        await parent.save({ session });

        currentUser = parent;
    }
};