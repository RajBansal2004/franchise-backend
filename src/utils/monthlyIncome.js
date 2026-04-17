const User = require('../models/User');

module.exports = async function calculateMonthlyIncome(userId){

  const user = await User.findById(userId);
  if(!user) return;

  let income = 0;

  // ✅ 15 level logic example (customize as per plan)
  if(user.level >= 1) income += 200;
  if(user.level >= 2) income += 300;
  if(user.level >= 3) income += 500;
  if(user.level >= 4) income += 700;
  if(user.level >= 5) income += 1000;
  if(user.level >= 6) income += 1500;
  if(user.level >= 7) income += 2000;
  if(user.level >= 8) income += 3000;
  if(user.level >= 9) income += 4000;
  if(user.level >= 10) income += 5000;
  if(user.level >= 11) income += 7000;
  if(user.level >= 12) income += 9000;
  if(user.level >= 13) income += 12000;
  if(user.level >= 14) income += 15000;
  if(user.level >= 15) income += 20000;

  // overwrite monthly income
  user.monthlyIncome = income;

  await user.save();
};