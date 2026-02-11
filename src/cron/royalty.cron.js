const cron = require('node-cron');
const User = require('../models/User');
const calculateRoyalty = require('../utils/royaltyEngine');

cron.schedule('0 0 1 * *', async () => {

  console.log("Royalty Distribution Running...");

  const users = await User.find();

  const companyTurnover = await getCompanyTurnover(); // tum banayoge

  for(const user of users){
     await calculateRoyalty(user._id, companyTurnover);
  }

});
