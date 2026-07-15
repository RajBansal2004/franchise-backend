const steps = require("../config/royaltySteps");

function calculateStepPending(user) {

    let carryLeft = user.leftBP || 0;
    let carryRight = user.rightBP || 0;

    const result = [];

    let unlocked = true;

    for (const step of steps) {

        const currentLeft = carryLeft;
        const currentRight = carryRight;

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

            userLeftBP: currentLeft,
            userRightBP: currentRight,

            remainBonusBP,
            remainIncentiveBP,

            status: unlocked
                ? (completed ? "Completed" : "Pending")
                : "Locked"
        });

        // ✅ Jitna available tha utna consume hoga
        carryLeft = Math.max(0, carryLeft - usedLeft);
        carryRight = Math.max(0, carryRight - usedRight);

        // ✅ Sirf status lock hoga
        if (!completed && unlocked) {
            unlocked = false;
        }
    }

    const completedSteps = result.filter(
        s => s.status === "Completed"
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