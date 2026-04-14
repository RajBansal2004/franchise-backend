const User = require('../models/User');

// ✅ RECURSIVE FUNCTION
const buildTree = async (userId) => {
  const user = await User.findById(userId)
    .lean();

  if (!user) return null;

  // LEFT CHILD
  let leftChild = null;
  if (user.leftChildren && user.leftChildren.length > 0) {
    leftChild = await buildTree(user.leftChildren[0]);
  }

  // RIGHT CHILD
  let rightChild = null;
  if (user.rightChildren && user.rightChildren.length > 0) {
    rightChild = await buildTree(user.rightChildren[0]);
  }

  return {
    ...user,
    leftChild,
    rightChild
  };
};

// ✅ API
exports.getMyTree = async (req, res) => {
  try {
    const tree = await buildTree(req.user.id);
    res.json(tree);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};