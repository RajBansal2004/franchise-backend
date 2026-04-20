const steps = require('../config/royaltySteps');

function calculateStepPending(user) {

  const result = [];

  let leftBP = user.leftBP || 0;
  let rightBP = user.rightBP || 0;

  let carryLeft = leftBP;
  let carryRight = rightBP;

  let isFirstCompleteDone = false;

  for (const step of steps) {

    let remainBonusBP = 0;
    let remainIncentiveBP = 0;
    let completed = false;

    // ✅ Only first level pe actual deduction hoga
    if (!isFirstCompleteDone) {

      const usedLeft = Math.min(carryLeft, step.leftReq);
      const usedRight = Math.min(carryRight, step.rightReq);

      remainBonusBP = step.leftReq - usedLeft;
      remainIncentiveBP = step.rightReq - usedRight;

      completed = (remainBonusBP === 0 && remainIncentiveBP === 0);

      if (completed) {
        // ✅ Deduct ONLY ONCE
        carryLeft -= step.leftReq;
        carryRight -= step.rightReq;

        isFirstCompleteDone = true;
      }

      result.push({
        step: step.step,
        name: step.name,
        totalBonusBP: step.leftReq,
        totalIncentiveBP: step.rightReq,
        userLeftBP: carryLeft,
        userRightBP: carryRight,
        remainBonusBP,
        remainIncentiveBP,
        status: completed ? 'Completed' : 'Pending'
      });

    } else {

      // ✅ After first completion → same carry BP use for all
      remainBonusBP = step.leftReq - carryLeft;
      remainIncentiveBP = step.rightReq - carryRight;

      if (remainBonusBP < 0) remainBonusBP = 0;
      if (remainIncentiveBP < 0) remainIncentiveBP = 0;

      completed = (remainBonusBP === 0 && remainIncentiveBP === 0);

      result.push({
        step: step.step,
        name: step.name,
        totalBonusBP: step.leftReq,
        totalIncentiveBP: step.rightReq,
        userLeftBP: carryLeft,
        userRightBP: carryRight,
        remainBonusBP,
        remainIncentiveBP,
        status: completed ? 'Completed' : 'Pending'
      });
    }
  }

  const completedSteps = result.filter(r => r.status === 'Completed').length;

  return {
    totalLevel: steps.length,
    completed: completedSteps,
    pending: steps.length - completedSteps,
    currentLevel: completedSteps,
    steps: result
  };
}

module.exports = calculateStepPending;