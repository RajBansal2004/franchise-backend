const User = require("../models/User");
const levels = require("../config/levels");

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

        // Associate Bonus

        if (user.level >= 1 && user.level <= 4) {

            user.associateBonusIncome =
                (user.associateBonusIncome || 0) + income;

            user.lifetimeAssociateBonusIncome =
                (user.lifetimeAssociateBonusIncome || 0) + income;

        }

        // Regional Bonus

        else if (user.level >= 5 && user.level <= 8) {

            user.regionalDirectorBonusIncome =
                (user.regionalDirectorBonusIncome || 0) + income;

            user.lifetimeRegionalDirectorBonusIncome =
                (user.lifetimeRegionalDirectorBonusIncome || 0) + income;

        }

        // State Bonus

        else if (user.level >= 9 && user.level <= 12) {

            user.stateDirectorBonusIncome =
                (user.stateDirectorBonusIncome || 0) + income;

            user.lifetimeStateDirectorBonusIncome =
                (user.lifetimeStateDirectorBonusIncome || 0) + income;

        }

        // National Bonus

        else if (user.level >= 13 && user.level <= 14) {

            user.nationalDirectorBonusIncome =
                (user.nationalDirectorBonusIncome || 0) + income;

            user.lifetimeNationalDirectorBonusIncome =
                (user.lifetimeNationalDirectorBonusIncome || 0) + income;

        }

        // International Bonus

        else if (user.level === 15) {

            user.internationalDirectorBonusIncome =
                (user.internationalDirectorBonusIncome || 0) + income;

            user.lifetimeInternationalDirectorBonusIncome =
                (user.lifetimeInternationalDirectorBonusIncome || 0) + income;

        }

        user.lastMonthlyPaidAt = now;

        await user.save();

    }

}