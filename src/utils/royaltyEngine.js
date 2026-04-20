const royaltyConfig = require('../config/royalty.config');
const User = require('../models/User');

async function calculateRoyalty(userId) {

  try {

    const user = await User.findById(userId);
    if (!user) return;

    // ❌ Level <5 → NO ROYALTY
    if (user.level < 5) return;

    const royaltySlab = royaltyConfig.find(r => r.level === user.level);
    if (!royaltySlab) return;

    const leftBP = user.monthlyLeftBP || 0;
    const rightBP = user.monthlyRightBP || 0;

    const pairBP = Math.min(leftBP, rightBP);

    // ❌ Target complete नहीं → NO ROYALTY
    if (pairBP < royaltySlab.target) return;

    const percent = royaltySlab.maxPercent;

    const royaltyIncome = (pairBP * percent) / 100;

    const currentMonth = new Date().getMonth();

    // ❌ Already paid
    if (user.lastRoyaltyMonth === currentMonth) return;

    // ✅ ADD income
    user.royaltyIncome += royaltyIncome;
    user.totalIncome += royaltyIncome;
    user.incomeWallet += royaltyIncome;

    user.lastRoyaltyMonth = currentMonth;

    await user.save();

  } catch (err) {
    console.log("Royalty Error", err.message);
  }

}

module.exports = calculateRoyalty;