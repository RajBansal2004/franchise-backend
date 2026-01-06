const mongoose = require('mongoose');


const rewardSchema = new mongoose.Schema({
user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
level: Number,
reward: String,
status: { type: String, default: 'PENDING' }
}, { timestamps: true });


module.exports = mongoose.model('Reward', rewardSchema);