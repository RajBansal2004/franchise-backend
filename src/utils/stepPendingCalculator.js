const steps = require('../config/royaltySteps');

function calculateStepPending(user) {

  const result = [];

  let leftBP = user.leftBP || 0;
  let rightBP = user.rightBP || 0;

  let isBlocked = false; // 👈 once pending, no more deduction

  for (const step of steps) {

    let usedLeft = 0;
    let usedRight = 0;
    let remainBonusBP = 0;
    let remainIncentiveBP = 0;
    let completed = false;

    if (!isBlocked) {

      // ✅ try to complete step
      usedLeft = Math.min(leftBP, step.leftReq);
      usedRight = Math.min(rightBP, step.rightReq);

      remainBonusBP = step.leftReq - usedLeft;
      remainIncentiveBP = step.rightReq - usedRight;

      completed =
        remainBonusBP === 0 &&
        remainIncentiveBP === 0;

      // ✅ if completed → deduct BP
      if (completed) {
        leftBP -= step.leftReq;
        rightBP -= step.rightReq;
      } else {
        // ❌ next steps block हो जाएंगे
        isBlocked = true;
      }

    } else {
      // 🔒 blocked state → no deduction
      remainBonusBP = step.leftReq;
      remainIncentiveBP = step.rightReq;
      completed = false;
    }

    result.push({
      step: step.step,
      name: step.name,

      totalBonusBP: step.leftReq,
      totalIncentiveBP: step.rightReq,

      userLeftBP: leftBP,
      userRightBP: rightBP,

      usedLeft,
      usedRight,

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
    currentLevel: completedSteps,
    steps: result
  };
}

module.exports = calculateStepPending;