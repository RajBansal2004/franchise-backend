const User = require('../models/User');

module.exports = async function addBP(userId, bp) {

  let user = await User.findById(userId);
  if (!user) return;

  // ✅ SELF BP
  user.selfBP += bp;
  await user.save();

  let parentId = user.parentId;
  let position = user.position;

  while (parentId) {

    const parent = await User.findById(parentId);
    if (!parent) break;

    if (position === 'LEFT') {

      parent.leftBP += bp;

      // ⭐ Weekly
      parent.weeklyLeftBP += bp;

      // ⭐ Monthly
      parent.monthlyLeftBP += bp;

    } else {

      parent.rightBP += bp;

      // ⭐ Weekly
      parent.weeklyRightBP += bp;

      // ⭐ Monthly
      parent.monthlyRightBP += bp;
    }

    await parent.save();

    position = parent.position;
    parentId = parent.parentId;
  }
};

