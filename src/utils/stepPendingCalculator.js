const steps = require('../config/royaltySteps');

function calculateStepPending(user) {
  const result = [];

  const leftBP = user.leftBP || 0;
  const rightBP = user.rightBP || 0;

  for (const step of steps) {

    // ✅ Direct check (independent level)
    const remainBonusBP =
      leftBP >= step.leftReq ? 0 : step.leftReq;

    const remainIncentiveBP =
      rightBP >= step.rightReq ? 0 : step.rightReq;

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

  const completedSteps = result.filter(r => r.status === 'Completed').length;

  return {
    totalLevel: steps.length,
    completed: completedSteps,
    pending: steps.length - completedSteps,
    currentLevel: completedSteps, // 🔵 BLUE LEVEL
    steps: result
  };
}

module.exports = calculateStepPending;
