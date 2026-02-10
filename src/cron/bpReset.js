const cron = require('node-cron');
const User = require('../models/User');

// Weekly Reset (Sunday 12 AM IST)
cron.schedule('0 0 * * 0', async ()=>{

 console.log("Weekly BP Reset Running");

 await User.updateMany({},{
  weeklyLeftBP:0,
  weeklyRightBP:0
 });

},{
 timezone:"Asia/Kolkata"
});


// Monthly Reset
cron.schedule('0 0 1 * *', async ()=>{

 console.log("Monthly BP Reset Running");

 await User.updateMany({},{
  monthlyLeftBP:0,
  monthlyRightBP:0
 });

},{
 timezone:"Asia/Kolkata"
});
