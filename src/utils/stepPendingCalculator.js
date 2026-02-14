const steps = require('../config/royaltySteps');

function calculateStepPending(user) {
  const result = [];

  const leftBP = user.leftBP || 0;
  const rightBP = user.rightBP || 0;

  // ✅ binary logic
  const weak = Math.min(leftBP, rightBP);
  const strong = Math.max(leftBP, rightBP);

  for (const step of steps) {

    const remainBonusBP = Math.max(step.leftReq - weak, 0);
    const remainIncentiveBP = Math.max(step.rightReq - strong, 0);

    const completed =
      remainBonusBP === 0 &&
      remainIncentiveBP === 0;

    result.push({
      step: step.step,
      name: step.name,

      totalBonusBP: step.leftReq,
      totalIncentiveBP: step.rightReq,

      userLeftBP: leftBP,
      userRightBP: rightBP,

      remainBonusBP,
      remainIncentiveBP,

      status: completed ? 'Completed' : 'Pending'
    });
  }

  return result;
}

module.exports = calculateStepPending;
