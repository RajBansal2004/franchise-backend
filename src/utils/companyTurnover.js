const Order = require('../models/Order');

async function getCompanyTurnover(){

  const orders = await Order.find({ status:"approved" });

  let total = 0;

  orders.forEach(o => {
    total += o.totalAmount;
  });

  return total;
}

module.exports = getCompanyTurnover;
