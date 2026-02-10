const User = require('../models/User');


exports.getMyTree = async (req, res) => {
const user = await User.findById(req.user.id)
.populate('leftChildren')
.populate('rightChildren');
res.json(user);
};