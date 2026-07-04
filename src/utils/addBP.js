const User = require('../models/User');

module.exports = async function addBP(userId, bp, session = null) {
  bp = Number(bp) || 0;
  if (bp <= 0) return;

  // 🔥 STEP 1 — user fetch WITH session
  let user = await User.findById(userId).session(session);
  if (!user) return;

  // 🔥 STEP 2 — self BP atomic update
  await User.updateOne(
    { _id: userId },
    { $inc: { selfBP: bp } },
    session ? { session } : {}
  );

  let parentId = user.parentId;
  let position = user.position;

  // 🔥 STEP 3 — upline propagation (atomic updates)
  while (parentId) {
    const parent = await User.findById(parentId).session(session);
    if (!parent) break;

    let update = {};

    if (position === 'LEFT') {
      update = {
        $inc: {
          leftBP: bp,
          weeklyLeftBP: bp,
          monthlyLeftBP: bp,
        },
      };
    } else {
      update = {
        $inc: {
          rightBP: bp,
          weeklyRightBP: bp,
          monthlyRightBP: bp,
        },
      };
    }

    await User.updateOne(
      { _id: parentId },
      update,
      session ? { session } : {}
    );

    position = parent.position;
    parentId = parent.parentId;
  }
};