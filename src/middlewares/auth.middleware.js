const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req,res,next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if(!token) return res.status(401).json({ message: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if(!user) return res.status(401).json({ message: 'Unauthorized' });
    req.user = user;
    next();
  } catch(err){
    return res.status(401).json({ message: 'Unauthorized', error: err.message });
  }
};

module.exports = auth;
