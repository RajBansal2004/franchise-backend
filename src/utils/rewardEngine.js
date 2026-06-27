const levels = require("../config/levels");

module.exports = function rewardEngine(user) {

    const currentLevel = levels.find(
        l => l.level === user.level
    );

    if (!currentLevel) return;

    if (!currentLevel.reward) return;

    if (!user.rewards)
        user.rewards = [];

    const alreadyReward = user.rewards.find(
        r => r.level === user.level
    );

    if (alreadyReward) return;

    user.rewards.push({

        level: currentLevel.level,

        rank: currentLevel.rank,

        name: currentLevel.reward,

        achievedAt: new Date()

    });

};