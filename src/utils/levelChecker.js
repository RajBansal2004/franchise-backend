const levels = require('../config/levels');

function getRoyaltyKey(level) {
  if (level >= 5 && level <= 8) return 'regional';
  if (level >= 9 && level <= 12) return 'state';
  if (level >= 13 && level <= 14) return 'national';
  if (level === 15) return 'international';
  return null;
}

module.exports = async function checkLevels(user) {
  let updated = false;

  for (const lvl of levels) {

    // already achieved → skip
    if (user.level >= lvl.level) continue;

    const leftOK = user.leftBP >= (lvl.leftBP || 0);
    const rightOK = user.rightBP >= (lvl.rightBP || 0);

    if (!leftOK || !rightOK) break; // next levels impossible

    // ✅ LEVEL ACHIEVED
    user.level = lvl.level;
    user.currentRank = lvl.rank;
    user.levelAchievedAt = new Date();

    // 🔐 Royalty eligibility
    const royaltyKey = getRoyaltyKey(lvl.level);
    if (royaltyKey) {
      user.royaltyEligible[royaltyKey] = true;
    }

    updated = true;
  }

  if (updated) {
    await user.save();
  }
};
