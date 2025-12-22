const Order = require('../models/Order');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

exports.ordersReport = async (req,res) => {
  try {
    const { from, to, franchise } = req.query;
    const q = {};
    if(franchise) q.franchise = franchise;
    if(from || to) q.createdAt = {};
    if(from) q.createdAt.$gte = new Date(from);
    if(to) q.createdAt.$lte = new Date(to);
    const orders = await Order.find(q).populate('franchise').limit(1000);
    const csvWriter = createCsvWriter({
      path: 'orders_report.csv',
      header: [
        {id:'orderId', title:'Order ID'},
        {id:'franchise', title:'Franchise'},
        {id:'totalAmount', title:'Total'}
      ]
    });
    const records = orders.map(o => ({ orderId: o.orderId, franchise: o.franchise?.name || '', totalAmount: o.totalAmount }));
    await csvWriter.writeRecords(records);
    res.download('orders_report.csv');
  } catch(err){ res.status(400).json({ error: err.message }); }
};
