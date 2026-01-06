const User = require('../models/User');


exports.getMyTree = async (req, res) => {
const user = await User.findById(req.user.id)
.populate('leftChild')
.populate('rightChild');
res.json(user);
};