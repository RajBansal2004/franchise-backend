const User = require('../models/User');
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

    if (user.level >= lvl.level) continue;

    const leftOK = user.leftBP >= (lvl.leftBP || 0);
    const rightOK = user.rightBP >= (lvl.rightBP || 0);

    if (!leftOK || !rightOK) break;

    user.level = lvl.level;
    user.currentRank = lvl.rank;
    user.levelAchievedAt = new Date();

const reward = lvl.reward || 0;

if (reward > 0) {

  if (!user.rewardLevels) {
    user.rewardLevels = [];
  }

  if (!user.rewardLevels.includes(lvl.level)) {

    user.levelRewardIncome =
      (user.levelRewardIncome || 0) + reward;

    user.totalIncome =
      (user.totalIncome || 0) + reward;

    user.incomeWallet =
      (user.incomeWallet || 0) + reward;

    user.lifetimeLevelRewardIncome =
      (user.lifetimeLevelRewardIncome || 0) + reward;

    user.lifetimeTotalIncome =
      (user.lifetimeTotalIncome || 0) + reward;

    user.rewardLevels.push(lvl.level);
  }
}

    const royaltyKey = getRoyaltyKey(lvl.level);

    if (royaltyKey) {
      user.royaltyEligible[royaltyKey] = true;
    }

    updated = true;
  }

  if (updated) await user.save();
};