const steps = require('../config/royaltySteps');

function calculateStepPending(user) {
  const result = [];

  const leftBP = user.leftBP || 0;
  const rightBP = user.rightBP || 0;

  // ✅ binary weak leg
  let availableBP = Math.min(leftBP, rightBP);

  for (const step of steps) {
    // 🔹 calculate remaining from available pool
    const remainBonusBP = Math.max(step.leftReq - availableBP, 0);
    const remainIncentiveBP = Math.max(step.rightReq - availableBP, 0);

    const completed =
      remainBonusBP === 0 &&
      remainIncentiveBP === 0;

    // ✅ if completed → consume BP
    if (completed) {
      availableBP -= Math.max(step.leftReq, step.rightReq);
      if (availableBP < 0) availableBP = 0;
    }

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
