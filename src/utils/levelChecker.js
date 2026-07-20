const levelSteps = require("../config/levelSteps");
const rewardEngine = require("./rewardEngine");
const calculateStepPending = require("../utils/stepPendingCalculator");

function getRoyaltyKey(level) {
    if (level >= 5 && level <= 8) return "regional";
    if (level >= 9 && level <= 12) return "state";
    if (level >= 13 && level <= 14) return "national";
    if (level === 15) return "international";
    return null;
}


module.exports = async function checkLevels(user, session = null) {

    if (!user) return;

    const royalty = calculateStepPending(user);

    const newLevel = royalty.completed;

    let newRank = "DIRECT_SELLER";

    if (newLevel > 0) {
        const level = levelSteps.find(x => x.step === newLevel);
        if (level) {
            newRank = level.name;
        }
    }

    if (
        user.level === newLevel &&
        user.currentRank === newRank
    ) {
        return user;
    }

    user.level = newLevel;
    user.currentRank = newRank;
    user.levelAchievedAt = new Date();

    user.royaltyEligible = {
        regional: false,
        state: false,
        national: false,
        international: false
    };

    const royaltyKey = getRoyaltyKey(newLevel);

    if (royaltyKey) {
        user.royaltyEligible[royaltyKey] = true;
    }

    await rewardEngine(user);

    if (session)
        await user.save({ session });
    else
        await user.save();

    return user;
};