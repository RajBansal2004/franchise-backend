function calculateWeeklyIncome(user) {
  const matchBP = Math.min(user.weeklyLeftBP, user.weeklyRightBP);

  if (matchBP < 50) return 0;

  const bpRate = 10;

  let maxCap = 0;

  if (user.activationBP === 51) {
    maxCap = 100000;
  } else if (user.activationBP === 101) {
    maxCap = 150000;
  }

  const income = matchBP * bpRate;

  return Math.min(income, maxCap);
}

module.exports = { calculateWeeklyIncome };