const steps = require('../config/royaltySteps');

function calculateStepPending(user) {
  const result = [];

  const leftBP = user.leftBP || 0;
  const rightBP = user.rightBP || 0;

  for (const step of steps) {
    const remainLeft = Math.max(step.leftReq - leftBP, 0);
    const remainRight = Math.max(step.rightReq - rightBP, 0);

    const completed = remainLeft === 0 && remainRight === 0;

    result.push({
      step: step.step,
      name: step.name,

      totalBonusBP: step.leftReq,
      totalIncentiveBP: step.rightReq,

      userLeftBP: leftBP,
      userRightBP: rightBP,

      remainBonusBP: remainLeft,
      remainIncentiveBP: remainRight,

      status: completed ? 'Completed' : 'Pending'
    });
  }

  return result;
}

module.exports = calculateStepPending;
