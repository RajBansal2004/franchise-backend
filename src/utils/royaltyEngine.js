const royaltyConfig = require("../config/royalty.config");
const User = require("../models/User");

async function calculateRoyalty(userId) {

  try {

    const user = await User.findById(userId);
    if (!user) return;

    // ❌ Level 5 se niche royalty nahi
    if (user.level < 5) return;

    const royaltySlab = royaltyConfig.find(
      r => r.level === user.level
    );

    if (!royaltySlab) return;

    // ==========================================
    // Monthly Income = Weekly + Repurchase
    // ==========================================

    const consideredIncome =
      (user.monthlyIncome || 0) +
      (user.monthlyRepurchaseIncome || 0);

    // ❌ Target complete nahi
    if (consideredIncome < royaltySlab.target) return;

    // Royalty %
    const percent = royaltySlab.maxPercent;

    // Royalty Income
    const royaltyIncome =
      (consideredIncome * percent) / 100;

    const currentMonth = new Date().getMonth();

    // ❌ Already Paid
    if (user.lastRoyaltyMonth === currentMonth) return;

    // ✅ Income Add
    user.royaltyIncome += royaltyIncome;
    user.totalIncome += royaltyIncome;
    user.incomeWallet += royaltyIncome;

    user.lifetimeRoyaltyIncome =
      (user.lifetimeRoyaltyIncome || 0) + royaltyIncome;

    user.lifetimeTotalIncome =
      (user.lifetimeTotalIncome || 0) + royaltyIncome;

    // ✅ Target Achieved Save
    if (!user.royaltyTargetAchieved) {
      user.royaltyTargetAchieved = {};
    }

    user.royaltyTargetAchieved[user.level] = true;

    user.lastRoyaltyMonth = currentMonth;

    await user.save();

  } catch (err) {

    console.log("Royalty Error :", err.message);

  }

}

module.exports = calculateRoyalty;