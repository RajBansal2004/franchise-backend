const royaltyConfig = require('../config/royalty.config');
const User = require('../models/User');

async function calculateRoyalty(user){

 try{

   if(user.level < 5) return;

   const royaltySlab = royaltyConfig.find(r => r.level === user.level);
   if(!royaltySlab) return;

   // ⭐ Pair BP (client logic)
   const pairBP = Math.min(user.monthlyLeftBP , user.monthlyRightBP);

   const percent = royaltySlab.maxPercent;

   const royaltyIncome = (pairBP * percent) / 100;

   user.royaltyIncome = royaltyIncome;

   if(royaltyIncome >= royaltySlab.target){
      user.royaltyEligible.regional = true;
   } else {
      user.royaltyEligible.regional = false;
   }

 }catch(err){
   console.log("Royalty Error", err.message);
 }

}

module.exports = calculateRoyalty;
