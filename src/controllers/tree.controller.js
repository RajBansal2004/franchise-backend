const User = require('../models/User');


// exports.getMyTree = async (req, res) => {
// const user = await User.findById(req.user.id)
// .populate('leftChildren')
// .populate('rightChildren');
// res.json(user);
// };


exports.getMyTree = async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('leftChildren')
    .populate('rightChildren');

  // 👉 FIRST CHILD nikal do
  const formattedUser = {
    ...user._doc,
    leftChild: user.leftChildren[0] || null,
    rightChild: user.rightChildren[0] || null,
  };

  res.json(formattedUser);
};