const User = require('../models/User');

module.exports = async function matchingIncome(userId){

  const user = await User.findById(userId);
  if(!user) return;

  const matchBP = Math.min(user.weeklyLeftBP, user.weeklyRightBP);

  // ❌ Minimum condition
  if(matchBP < 50) return;

  // ✅ ₹10 per BP
  let income = matchBP * 10;

  let cap = 0;

  // ✅ Activation based cap
  if(user.activationBP === 51){
    cap = 100000; // 1 lakh
  } 
  else if(user.activationBP === 101){
    cap = 150000; // 1.5 lakh
  }

  // ✅ Cap apply
  if(cap && user.weeklyIncome + income > cap){
    income = cap - user.weeklyIncome;
    if(income <= 0) return;
  }

  user.weeklyIncome += income;
  user.totalIncome += income;
  user.incomeWallet += income;

 user.weeklyLeftBP = Math.max(0, user.weeklyLeftBP - matchBP);
user.weeklyRightBP = Math.max(0, user.weeklyRightBP - matchBP);

  await user.save();
};