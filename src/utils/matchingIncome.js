const User = require('../models/User');

module.exports = async function matchingIncome(userId){

  const user = await User.findById(userId);
  if(!user) return;

  const leftBP = user.weeklyLeftBP || 0;
  const rightBP = user.weeklyRightBP || 0;

  const matchBP = Math.min(leftBP, rightBP);

  const pair = Math.floor(matchBP / 50);

  if(pair <= 0) return;

  let income = pair * 50 * 10;

  let cap = 0;

  if(user.activationBP === 51) cap = 100000;
  else if(user.activationBP === 101) cap = 150000;

 if(cap && user.totalIncome + income > cap){
  income = cap - user.totalIncome;
}

  const usedBP = pair * 50;

  user.weeklyIncome += income;
  user.totalIncome += income;
  user.incomeWallet += income;

  user.weeklyLeftBP -= usedBP;
  user.weeklyRightBP -= usedBP;

  user.lastWeeklyPaidAt = new Date();

  await user.save();

  console.log(`✅ Matching Income ₹${income} given to ${user.uniqueId}`);
};