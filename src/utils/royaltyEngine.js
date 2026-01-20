module.exports = function calculateRoyalty(user, companyTurnover) {
  let percent = 0;

  if (user.level >= 5 && user.level <= 8) percent = 0.01;
  else if (user.level >= 9 && user.level <= 12) percent = 0.02;
  else if (user.level >= 13 && user.level <= 14) percent = 0.03;
  else if (user.level >= 15) percent = 0.04;

  if (percent === 0) return 0;

  const royaltyIncome = companyTurnover * percent;

  user.incomeWallet += royaltyIncome;
  user.totalIncome += royaltyIncome;
  user.monthlyIncome += royaltyIncome;

  return royaltyIncome;
};
