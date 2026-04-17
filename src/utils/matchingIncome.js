const User = require('../models/User');

module.exports = async function matchingIncome(userId){

  const user = await User.findById(userId);
  if(!user) return;

  const pairBP = Math.min(user.leftBP, user.rightBP);
  const pairCount = Math.floor(pairBP / 100);

  if(pairCount <= 0) return;

  let income = pairCount * 1000;

  let cap = 0;

  if(user.selfBP >= 51 && user.selfBP <= 100){
    cap = 100000;
  } else if(user.selfBP >= 101){
    cap = 150000;
  }

  if(cap && user.weeklyIncome + income > cap){
    income = cap - user.weeklyIncome;
    if(income <= 0) return;
  }

  user.incomeWallet += income;
  user.totalIncome += income;
  user.weeklyIncome += income;

  const usedBP = pairCount * 100;

  user.leftBP = Math.max(0, user.leftBP - usedBP);
  user.rightBP = Math.max(0, user.rightBP - usedBP);

  await user.save();
};