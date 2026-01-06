const Reward = require('../models/Reward');


module.exports = async function (user, levelConfig) {
if (!levelConfig.reward) return;
await Reward.create({
user: user._id,
level: levelConfig.level,
reward: levelConfig.reward
});
};