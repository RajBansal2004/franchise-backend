module.exports = function (bp) {
if (bp >= 20000) return 100000;
if (bp >= 1000) return 5000;
if (bp >= 500) return 2500;
if (bp >= 200) return 1000;
return 0;
};