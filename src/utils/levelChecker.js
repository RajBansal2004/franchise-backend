const levelSteps = require("../config/levelSteps");
const rewardEngine = require("./rewardEngine");

function getRoyaltyKey(level) {
    if (level >= 5 && level <= 8) return "regional";
    if (level >= 9 && level <= 12) return "state";
    if (level >= 13 && level <= 14) return "national";
    if (level === 15) return "international";
    return null;
}

module.exports = async function checkLevels(user, session = null) {

    if (!user) return null;

    // ==========================
    // Inactive User
    // ==========================
    if (
        !user.isActive ||
        !user.activationBP ||
        (user.selfBP || 0) <= 0
    ) {

        const needUpdate =
            user.level !== 0 ||
            user.currentRank !== "DIRECT_SELLER";

        if (needUpdate) {

            user.level = 0;
            user.currentRank = "DIRECT_SELLER";

            user.royaltyEligible = {
                regional: false,
                state: false,
                national: false,
                international: false
            };

            user.levelAchievedAt = null;

            if (session) {
                await user.save({ session });
            } else {
                await user.save();
            }
        }

        return user;
    }

    // ==========================
    // Calculate Level
    // ==========================

    let newLevel = 0;
    let newRank = "DIRECT_SELLER";

    for (const lvl of levelSteps) {

        if (
            (user.leftBP || 0) >= lvl.leftReq &&
            (user.rightBP || 0) >= lvl.rightReq
        ) {
            newLevel = lvl.step;
            newRank = lvl.name;
        }
    }

    // ==========================
    // No Change
    // ==========================

    if (
        user.level === newLevel &&
        user.currentRank === newRank
    ) {
        return user;
    }

    // ==========================
    // Update Level
    // ==========================

    user.level = newLevel;
    user.currentRank = newRank;
    user.levelAchievedAt = new Date();

    // Reset Royalty Flags
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

    // Reward Engine
    await rewardEngine(user);

    if (session) {
        await user.save({ session });
    } else {
        await user.save();
    }

    return user;
};