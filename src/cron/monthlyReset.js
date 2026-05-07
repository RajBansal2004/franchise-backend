const cron = require('node-cron');
const calculateMonthlyIncome = require('../utils/monthlyIncome');

cron.schedule('59 23 28-31  * *', async () => {
  console.log("Monthly Processing Started");

  await calculateMonthlyIncome();

  await User.updateMany({}, {
    $set: {
      monthlyLeftBP: 0,
      monthlyRightBP: 0,
    }
  });

  console.log("Monthly Processing Done");
}
  , {
    timezone: "Asia/Kolkata"
  });