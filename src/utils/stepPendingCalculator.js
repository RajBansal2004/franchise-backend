const steps = require("../config/royaltySteps");

function calculateStepPending(user) {

    let carryLeft = user.leftBP || 0;
    let carryRight = user.rightBP || 0;

    const result = [];

    let unlocked = true;

    for (const step of steps) {

        // Agar previous step pending hai
        if (!unlocked) {

            result.push({
                step: step.step,
                name: step.name,

                totalBonusBP: step.leftReq,
                totalIncentiveBP: step.rightReq,

                userLeftBP: 0,
                userRightBP: 0,

                remainBonusBP: step.leftReq,
                remainIncentiveBP: step.rightReq,

                status: "Locked"
            });

            continue;
        }

        const usedLeft = Math.min(carryLeft, step.leftReq);
        const usedRight = Math.min(carryRight, step.rightReq);

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

            userLeftBP: carryLeft,
            userRightBP: carryRight,

            remainBonusBP,
            remainIncentiveBP,

            status: completed ? "Completed" : "Pending"
        });

        if (completed) {

            carryLeft -= step.leftReq;
            carryRight -= step.rightReq;

        } else {

            // Yahi sabse important hai
            // Ab agla level lock ho jayega
            unlocked = false;
        }
    }

    const completedSteps =
        result.filter(x => x.status === "Completed").length;

    return {

        totalLevel: steps.length,

        completed: completedSteps,

        pending: steps.length - completedSteps,

        currentLevel: completedSteps + 1,

        steps: result
    };
}

module.exports = calculateStepPending;