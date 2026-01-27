const steps = require('../config/royaltySteps');

function calculateStepPending(user) {
  const result = [];

  for (const step of steps) {
    const remainLeft = Math.max(step.leftReq - user.leftBusiness, 0);
    const remainRight = Math.max(step.rightReq - user.rightBusiness, 0);

    const completed = remainLeft === 0 && remainRight === 0;

    result.push({
      step: step.step,
      totalSAOSP: step.leftReq,
      totalSGOSP: step.rightReq,
      SAOSP: user.leftBusiness,
      SGOSP: user.rightBusiness,
      remainSAOSP: remainLeft,
      remainSGOSP: remainRight,
      status: completed ? 'Complete' : 'Pending'
    });
  }

  return result;
}

module.exports = calculateStepPending;
