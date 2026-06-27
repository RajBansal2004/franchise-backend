const User = require("../models/User");

module.exports = async function repurchaseIncome(startUserId, totalBP, session) {

    let currentUser = await User.findById(startUserId).session(session);

    while (currentUser) {

        if (currentUser.isActive) {

            const income = totalBP * 5;

            let cap = Infinity;

            if (currentUser.activationBP === 51)
                cap = 100000;
            else if (currentUser.activationBP === 101)
                cap = 150000;

            let payableIncome = income;

            if (currentUser.totalIncome >= cap) {
                payableIncome = 0;
            } else if (currentUser.totalIncome + income > cap) {
                payableIncome = cap - currentUser.totalIncome;
            }

            if (payableIncome > 0) {

                currentUser.repurchaseIncome =
                    (currentUser.repurchaseIncome || 0) + payableIncome;

                currentUser.lifetimeRepurchaseIncome =
                    (currentUser.lifetimeRepurchaseIncome || 0) + payableIncome;

                currentUser.totalIncome =
                    (currentUser.totalIncome || 0) + payableIncome;

                currentUser.lifetimeTotalIncome =
                    (currentUser.lifetimeTotalIncome || 0) + payableIncome;

                currentUser.incomeWallet =
                    (currentUser.incomeWallet || 0) + payableIncome;

                await currentUser.save({ session });
            }
        }

        if (!currentUser.parentId)
            break;

        currentUser = await User.findById(currentUser.parentId).session(session);
    }
};