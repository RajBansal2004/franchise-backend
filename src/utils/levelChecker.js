const levels = require('../config/levels');


module.exports = function (user) {
levels.forEach(lvl => {
if (user.leftBP >= (lvl.leftBP || 0) && user.rightBP >= (lvl.rightBP || 0) && user.level < lvl.level) {
user.level = lvl.level;
user.currentRank = lvl.rank;
if (lvl.royalty) user.royaltyEligible = true;
}
});
};