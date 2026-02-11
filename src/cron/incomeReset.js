cron.schedule('0 0 * * 0', async () => {

 await User.updateMany({},{
  weeklyIncome:0
 });

});

cron.schedule('0 0 1 * *', async () => {

 await User.updateMany({},{
  monthlyIncome:0
 });

});
