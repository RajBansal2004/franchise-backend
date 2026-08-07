const Debit = require("../models/Debit");

module.exports = async function checkLevelReward(user, session) {

    const rewards = [];

    if (user.level >= 7 && !user.isGoldRewardGiven) {

        const amount = 40000;

        user.goldFund += amount;

        user.levelRewardIncome =
            (user.levelRewardIncome || 0) + amount;

        user.lifetimeLevelRewardIncome =
            (user.lifetimeLevelRewardIncome || 0) + amount;

        user.totalIncome += amount;
        user.lifetimeTotalIncome += amount;

        user.incomeWallet += amount;

        user.isGoldRewardGiven = true;

        rewards.push({
            amount,
            description: "Gold Fund Reward (Level 7)"
        });
    }

    if (user.level >= 11 && !user.isBikeRewardGiven) {

        const amount = 250000;

        user.bikeFund += amount;

        user.levelRewardIncome =
            (user.levelRewardIncome || 0) + amount;

        user.lifetimeLevelRewardIncome =
            (user.lifetimeLevelRewardIncome || 0) + amount;

        user.totalIncome += amount;
        user.lifetimeTotalIncome += amount;

        user.incomeWallet += amount;

        user.isBikeRewardGiven = true;

        rewards.push({
            amount,
            description: "Bike Fund Reward (Level 11)"
        });
    }

    if (user.level >= 14 && !user.isCarRewardGiven) {

        const amount = 800000;

        user.carFund += amount;

        user.levelRewardIncome =
            (user.levelRewardIncome || 0) + amount;

        user.lifetimeLevelRewardIncome =
            (user.lifetimeLevelRewardIncome || 0) + amount;

        user.totalIncome += amount;
        user.lifetimeTotalIncome += amount;

        user.incomeWallet += amount;

        user.isCarRewardGiven = true;

        rewards.push({
            amount,
            description: "Car Fund Reward (Level 14)"
        });
    }

    for (const reward of rewards) {

        await Debit.create([{
            type: "USER",
            subType: "LEVEL_REWARD",

            name: user.fullName,
            loginId: user.uniqueId,
            mobile: user.mobile,

            amount: reward.amount,

            minusTds: 0,
            minusMaintenance: 0,
            finalAmount: reward.amount,

            description: reward.description,

            date: new Date()

        }], { session });

    }

};