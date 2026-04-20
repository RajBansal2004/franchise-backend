const steps = require('../config/royaltySteps');

function calculateStepPending(user) {

  const result = [];

  // ✅ ORIGINAL BP
  let leftBP = user.leftBP || 0;
  let rightBP = user.rightBP || 0;

  for (const step of steps) {

    // ✅ CHECK USING CURRENT BALANCE
    const usedLeft = Math.min(leftBP, step.leftReq);
    const usedRight = Math.min(rightBP, step.rightReq);

    const remainBonusBP = step.leftReq - usedLeft;
    const remainIncentiveBP = step.rightReq - usedRight;

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

      usedLeft,
      usedRight,

      remainBonusBP,
      remainIncentiveBP,

      status: completed ? 'Completed' : 'Pending'
    });

    // ✅ 🔥 CARRY FORWARD LOGIC (MAIN FIX)
    if (completed) {
      leftBP -= step.leftReq;
      rightBP -= step.rightReq;
    } else {
      // ❌ agar current step complete nahi hua → आगे break
      break;
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