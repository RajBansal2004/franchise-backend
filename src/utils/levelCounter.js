const User = require('../models/User');

async function countLevelMembers(rootUserId, targetLevel) {
  let currentLevelUsers = [rootUserId];
  let level = 0;

  while (level < targetLevel && currentLevelUsers.length) {
    const children = await User.find(
      { parentId: { $in: currentLevelUsers } },
      '_id'
    );

    currentLevelUsers = children.map(u => u._id);
    level++;
  }

  return currentLevelUsers.length;
}

module.exports = { countLevelMembers };
