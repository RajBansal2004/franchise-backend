const User = require('../models/User');

module.exports = async function addBP(userId, bp) {

 let user = await User.findById(userId);
 if (!user) return;

 // ⭐ Self BP
 user.selfBP += bp;
 await user.save();

 let parentId = user.parentId;
 let position = user.position;

 while (parentId) {

  const parent = await User.findById(parentId);
  if (!parent) break;

  if (position === 'LEFT') {

    parent.leftBP += bp;
    parent.weeklyLeftBP += bp;
    parent.monthlyLeftBP += bp;

  } else {

    parent.rightBP += bp;
    parent.weeklyRightBP += bp;
    parent.monthlyRightBP += bp;

  }

  await parent.save();

  position = parent.position;
  parentId = parent.parentId;
 }
};
