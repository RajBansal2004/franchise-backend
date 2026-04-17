const User = require('../models/User');

module.exports = async function matchingIncome(userId){

  const user = await User.findById(userId);
  if(!user) return;

  const matchBP = Math.min(user.weeklyLeftBP, user.weeklyRightBP);

  if(matchBP < 50) return;

  let income = matchBP * 10;

  let cap = 0;

  if(user.activationBP === 51) cap = 100000;
  else if(user.activationBP === 101) cap = 150000;

  if(cap && user.weeklyIncome + income > cap){
    income = cap - user.weeklyIncome;
    if(income <= 0) return;
  }

  user.weeklyIncome += income;
  user.totalIncome += income;
  user.incomeWallet += income;

  user.weeklyLeftBP -= matchBP;
  user.weeklyRightBP -= matchBP;

  user.lastWeeklyPaidAt = new Date();

  await user.save();
};