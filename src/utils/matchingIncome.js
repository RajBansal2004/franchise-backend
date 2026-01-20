module.exports = function matchingIncome(user) {
  const pairBP = Math.min(user.leftBP, user.rightBP);
  const usedBP = user.bpWallet || 0;
  const availableBP = pairBP - usedBP;

  if (availableBP < 100) return 0;

  const pairs = Math.floor(availableBP / 100);
  let income = pairs * 1000;

  // CAPPING
  let cap = 100000;
  if (user.level >= 5) cap = 150000;

  if (income > cap) income = cap;

  user.bpWallet += pairs * 100;
  user.incomeWallet += income;
  user.totalIncome += income;
  user.weeklyIncome += income;

  return income;
};
