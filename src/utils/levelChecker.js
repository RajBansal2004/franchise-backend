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

    let newLevel = 0;
    let newRank = "DIRECT_SELLER";

    for (const lvl of levelSteps) {

        if (
            user.leftBP >= lvl.leftReq &&
            user.rightBP >= lvl.rightReq
        ) {

            newLevel = lvl.step;
            newRank = lvl.name;

        }

    }

    // Agar level change hua tabhi update karo
    if (newLevel !== user.level) {

        user.level = newLevel;
        user.currentRank = newRank;
        user.levelAchievedAt = new Date();

        const royaltyKey = getRoyaltyKey(newLevel);

        if (royaltyKey) {
            user.royaltyEligible[royaltyKey] = true;
        }

        rewardEngine(user);

        if (session) {
            await user.save({ session });
        } else {
            await user.save();
        }

    } else if (user.currentRank !== newRank) {

        // Agar level same hai par rank mismatch hai to rank bhi fix kar do
        user.currentRank = newRank;

        if (session) {
            await user.save({ session });
        } else {
            await user.save();
        }
    }

};