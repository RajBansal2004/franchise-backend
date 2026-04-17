module.exports = function calculateMonthlyIncome(user){

  let income = 0;

  // ✅ Example (customize per plan)
  if(user.level >= 5) income += 1000;
  if(user.level >= 10) income += 3000;
  if(user.level >= 15) income += 7000;

  return income;
};