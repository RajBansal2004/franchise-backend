const User = require('../models/User');

module.exports = async function calculateMonthlyIncome(){

  const users = await User.find();
  const now = new Date();

  for (let user of users){

    if(
      user.lastMonthlyPaidAt &&
      new Date(user.lastMonthlyPaidAt).getMonth() === now.getMonth()
    ) continue;

    let income = 0;

    const slabs = [200,300,500,700,1000,1500,2000,3000,4000,5000,7000,9000,12000,15000,20000];

    for(let i = 0; i < slabs.length; i++){
      if(user.level >= i+1){
        income += slabs[i];
      }
    }

    user.monthlyIncome = income;
    user.totalIncome += income;
    user.incomeWallet += income;
    user.lastMonthlyPaidAt = now;

    await user.save();
  }
};