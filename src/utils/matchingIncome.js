const User = require('../models/User');
const Credit = require("../models/Credit");

module.exports = async function matchingIncome(userId, session) {

  const user = await User.findById(userId).session(session);
  if (!user) return;

  const leftBP = user.weeklyLeftBP || 0;
  const rightBP = user.weeklyRightBP || 0;

  const matchBP = Math.min(leftBP, rightBP);
  const pair = Math.floor(matchBP / 50);

  if (pair <= 0) return;

  let income = pair * 50 * 10;

  let cap = 0;
  if (user.activationBP === 51) cap = 100000;
  else if (user.activationBP === 101) cap = 150000;

  // ✅ CAP SAFETY
  if (cap && user.totalIncome >= cap) return;

  if (cap && user.totalIncome + income > cap) {
    income = cap - user.totalIncome;
  }

  if (income <= 0) return;

  const usedBP = pair * 50;

  // ✅ UPDATE USER
  user.weeklyIncome = (user.weeklyIncome || 0) + income;
  user.totalIncome = (user.totalIncome || 0) + income;
  user.incomeWallet = (user.incomeWallet || 0) + income;
  user.walletBalance = (user.walletBalance || 0) + income;

  // ✅ SAFE BP DEDUCTION
  user.weeklyLeftBP = Math.max(0, user.weeklyLeftBP - usedBP);
  user.weeklyRightBP = Math.max(0, user.weeklyRightBP - usedBP);

  user.lastWeeklyPaidAt = new Date();

  
   await Credit.insertMany([{
  userId: user._id,
  type: "USER",
  incomeType: "MATCHING",
  amount: income,
  name: user.fullName,
  loginId: user.uniqueId,
  mobile: user.mobile,
  remark: "Matching Income",
  date: new Date()
}], { session });

  await user.save({ session });
};