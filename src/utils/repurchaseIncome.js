const User = require("../models/User");
const Debit = require("../models/Debit");
const getDirectionForAncestor = (ancestorPath, userPath) => {

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
};
module.exports = async function repurchaseIncome(startUserId, totalBP, session) {

    const user = await User.findById(startUserId).session(session);

    if (!user || !user.isActive) return;
    if (user.role === "ADMIN") return;

    /* ==========================================
       SELF REPURCHASE INCOME
    ========================================== */

    const income = totalBP * 5;

    let cap = Infinity;

    if (user.activationBP === 51)
        cap = 100000;
    else if (user.activationBP === 101)
        cap = 150000;

    let payableIncome = income;

    if (user.totalIncome >= cap) {

        payableIncome = 0;

    } else if (user.totalIncome + income > cap) {

        payableIncome = cap - user.totalIncome;
    }

    if (payableIncome > 0) {

        user.repurchaseIncome += payableIncome;

        user.monthlyRepurchaseIncome =
            (user.monthlyRepurchaseIncome || 0) + payableIncome;

        user.lifetimeRepurchaseIncome += payableIncome;

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

        await parent.save({ session });

        // ❌ Matching income yahan mat call karo.
        // Income sirf Weekly Closing me milegi.

        currentUser = parent;
    }
};