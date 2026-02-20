const User = require('../models/User');

module.exports = async function addBP(userId, bp) {
  bp = Number(bp) || 0;

  let user = await User.findById(userId);
  if (!user) return;

  // ✅ SAFE SELF BP
  user.selfBP = Number(user.selfBP || 0) + bp;
  await user.save({ validateBeforeSave: false });

  let parentId = user.parentId;
  let position = user.position;

  while (parentId) {
    const parent = await User.findById(parentId);
    if (!parent) break;

    // ✅ initialize all numeric fields safely
    parent.leftBP = Number(parent.leftBP || 0);
    parent.rightBP = Number(parent.rightBP || 0);
    parent.weeklyLeftBP = Number(parent.weeklyLeftBP || 0);
    parent.weeklyRightBP = Number(parent.weeklyRightBP || 0);
    parent.monthlyLeftBP = Number(parent.monthlyLeftBP || 0);
    parent.monthlyRightBP = Number(parent.monthlyRightBP || 0);

    if (position === 'LEFT') {
      parent.leftBP += bp;
      parent.weeklyLeftBP += bp;
      parent.monthlyLeftBP += bp;
    } else {
      parent.rightBP += bp;
      parent.weeklyRightBP += bp;
      parent.monthlyRightBP += bp;
    }

    await parent.save({ validateBeforeSave: false });

    position = parent.position;
    parentId = parent.parentId;
  }
};