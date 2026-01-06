const User = require('../models/User');
const matchIncome = require('../utils/matchingIncome');
const checkLevel = require('../utils/levelChecker');


exports.calculateIncome = async (req, res) => {
const user = await User.findById(req.user.id);
const income = matchIncome(user);
checkLevel(user);
await user.save();
res.json({ income, wallet: user.incomeWallet, rank: user.currentRank });
};