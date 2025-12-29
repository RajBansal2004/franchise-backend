// controllers/tree.controller.js
const buildTree = require('../utils/treeBuilder');

exports.getMyTree = async (req, res) => {
  const tree = await buildTree(req.user.id, 3);
  res.json(tree);
};
