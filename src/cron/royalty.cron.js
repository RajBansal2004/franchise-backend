const cron = require('node-cron');
const User = require('../models/User');
const calculateRoyalty = require('../utils/royaltyEngine');

cron.schedule('0 0 1 * *', async () => {

  console.log("🔥 Royalty Distribution Running...");

  const users = await User.find({
    isActive: true,
    kycStatus: 'approved'
  });

  for(const user of users){
     await calculateRoyalty(user._id);
  }

  console.log("✅ Royalty Done");

}, {
  timezone: "Asia/Kolkata"
});