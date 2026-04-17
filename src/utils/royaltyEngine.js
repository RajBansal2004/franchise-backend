const royaltyConfig = require('../config/royalty.config');
const User = require('../models/User');

function getRoyaltyKey(level) {
  if (level >= 5 && level <= 8) return 'regional';
  if (level >= 9 && level <= 12) return 'state';
  if (level >= 13 && level <= 14) return 'national';
  if (level === 15) return 'international';
  return null;
}

async function calculateRoyalty(userId) {

  try {

    const user = await User.findById(userId);
    if (!user) return;

    if (user.level < 5) return;

    const royaltySlab = royaltyConfig.find(r => r.level === user.level);
    if (!royaltySlab) return;

    // ⭐ Pair BP
    const pairBP = Math.min(user.monthlyLeftBP, user.monthlyRightBP);

    if (pairBP <= 0) return;

    const percent = royaltySlab.maxPercent;

    const royaltyIncome = (pairBP * percent) / 100;
const currentMonth = new Date().getMonth();

if(user.lastRoyaltyMonth === currentMonth){
  return; // already paid
}
    // ✅ ADD (not replace)
    user.royaltyIncome += royaltyIncome;
    user.totalIncome += royaltyIncome;
    user.incomeWallet += royaltyIncome;

    // ✅ Correct eligibility mapping
    const key = getRoyaltyKey(user.level);
    if (key) {
      user.royaltyEligible[key] = pairBP >= royaltySlab.target;
    }
    user.lastRoyaltyMonth = currentMonth;


    await user.save();

  } catch (err) {
    console.log("Royalty Error", err.message);
  }

}

module.exports = calculateRoyalty;