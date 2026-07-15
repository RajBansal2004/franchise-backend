const steps = require("../config/royaltySteps");

function calculateStepPending(user) {

    let carryLeft = user.leftBP || 0;
    let carryRight = user.rightBP || 0;

    const result = [];

    let unlocked = true;

    for (const step of steps) {

        // Current available BP
        const currentLeft = carryLeft;
        const currentRight = carryRight;

        // Jitna available hai utna hi use hoga
        const usedLeft = Math.min(currentLeft, step.leftReq);
        const usedRight = Math.min(currentRight, step.rightReq);

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

            // User ke paas is level ke time kitna BP tha
            userLeftBP: currentLeft,
            userRightBP: currentRight,

            remainBonusBP,
            remainIncentiveBP,

            status: unlocked
                ? (completed ? "Completed" : "Pending")
                : "Locked"
        });

        // Available BP consume kar do
        carryLeft -= usedLeft;
        carryRight -= usedRight;

        // First incomplete level ke baad next sab lock
        if (!completed) {
            unlocked = false;
        }
    }

    const completedSteps = result.filter(
        x => x.status === "Completed"
    ).length;

    return {
        totalLevel: steps.length,
        completed: completedSteps,
        pending: steps.length - completedSteps,
        currentLevel: completedSteps + 1,
        steps: result
    };
}

module.exports = calculateStepPending;