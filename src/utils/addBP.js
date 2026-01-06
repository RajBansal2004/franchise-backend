const User = require('../models/User');


module.exports = async function addBP(userId, bp) {
let user = await User.findById(userId);
user.selfBP += bp;
await user.save();


let parent = user.parentId;
let pos = user.position;


while (parent) {
let p = await User.findById(parent);
pos === 'LEFT' ? p.leftBP += bp : p.rightBP += bp;
await p.save();
pos = p.position;
parent = p.parentId;
}
};