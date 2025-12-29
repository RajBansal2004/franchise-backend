const User = require('../models/User');

async function buildTree(userId, depth = 3) {
  if (!userId || depth === 0) return null;

  const user = await User.findById(userId)
    .select('fullName uniqueId role leftChild rightChild');

  if (!user) return null;

  return {
    _id: user._id,
    fullName: user.fullName,
    uniqueId: user.uniqueId,
    left: await buildTree(user.leftChild, depth - 1),
    right: await buildTree(user.rightChild, depth - 1)
  };
}

module.exports = buildTree;
