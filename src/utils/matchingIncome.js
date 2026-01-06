module.exports = function (user) {
const pair = Math.min(user.leftBP, user.rightBP);
const available = pair - user.matchedBP;
if (available <= 0) return 0;


const pairs = Math.floor(available / 100);
let income = pairs * 1000;


if (income > user.maxCapping) income = user.maxCapping;


user.matchedBP += pairs * 100;
user.incomeWallet += income;
return income;
};