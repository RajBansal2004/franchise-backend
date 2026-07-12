const User = require("../models/User");

module.exports = async function repurchaseIncome(startUserId, totalBP, session) {

    const user = await User.findById(startUserId).session(session);

    if (!user || !user.isActive) return;
    if (user.role === "ADMIN") return;

   //---------------------------------------
// SELF REPURCHASE INCOME
//---------------------------------------

if (user.level >= 1 && user.level <= 4) {

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

        user.lifetimeRepurchaseIncome += payableIncome;

        user.totalIncome += payableIncome;

        user.lifetimeTotalIncome += payableIncome;

        user.incomeWallet += payableIncome;

        await user.save({ session });

    }

}

    //---------------------------------------
    // REPURCHASE BP PROPAGATION
    //---------------------------------------

    let parentId = user.parentId;

    const direction = user.rootPosition || user.position;

    while (parentId) {

        const parent = await User.findById(parentId).session(session);

        if (!parent) break;

        if (direction === "LEFT") {

            parent.repurchaseLeftBP =
                (parent.repurchaseLeftBP || 0) + totalBP;

        } else {

            parent.repurchaseRightBP =
                (parent.repurchaseRightBP || 0) + totalBP;

        }

        await parent.save({ session });

        parentId = parent.parentId;
    }

};