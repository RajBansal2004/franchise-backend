const royaltyConfig = require('../config/royalty.config');
const User = require('../models/User');

async function calculateRoyalty(userId, companyTurnover){

 try{

   const user = await User.findById(userId);

   if(!user) return;

   const userLevel = user.level;

   // find slab
   const royaltySlab = royaltyConfig.find(r => r.level === userLevel);

   if(!royaltySlab) return;

   // check target eligibility
   if(companyTurnover < royaltySlab.target) return;

   // percentage choose (max percent apply kar rahe)
   const percent = royaltySlab.maxPercent;

   const royaltyIncome = (companyTurnover * percent) / 100;

   user.royaltyIncome += royaltyIncome;
   user.incomeWallet += royaltyIncome;
   user.totalIncome += royaltyIncome;

   await user.save();

 }catch(err){
   console.log("Royalty Error", err.message);
 }

}

module.exports = calculateRoyalty;
