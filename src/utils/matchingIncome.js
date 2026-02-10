const User = require('../models/User');

module.exports = async function matchingIncome(userId){

  const user = await User.findById(userId);

  if(!user) return;

  // ⭐ Pair BP
  const pairBP = Math.min(user.leftBP , user.rightBP);

  // ⭐ 100 BP = 1 Pair
  const pairCount = Math.floor(pairBP / 100);

  if(pairCount <= 0) return;

  let income = pairCount * 1000;

  // ⭐ Weekly Capping
  let cap = 0;

  if(user.selfBP >= 51 && user.selfBP <= 100){
    cap = 100000;
  }
  else if(user.selfBP >= 101){
    cap = 150000;
  }

  if(cap > 0){
    if(user.weeklyIncome + income > cap){
      income = cap - user.weeklyIncome;

      if(income <= 0) return;
    }
  }

  // ⭐ Wallet Update
  user.incomeWallet += income;
  user.totalIncome += income;
  user.weeklyIncome += income;

  // ⭐ BP Deduct only used BP
  const usedBP = pairCount * 100;

  user.leftBP -= usedBP;
  user.rightBP -= usedBP;

  await user.save();
};
