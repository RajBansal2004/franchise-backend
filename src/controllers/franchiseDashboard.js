const Order = require('../models/Order');
const User = require('../models/User');
const Stock = require('../models/Stock');
const Income = require('../models/Income');
const mongoose = require('mongoose');

exports.getFranchiseDashboard = async (req, res) => {
  try {
    const franchiseId = new mongoose.Types.ObjectId(req.user.id);

    // ✅ Total Orders
    const totalOrders = await Order.countDocuments({ franchiseId });

    // ✅ Active IDs
    const activeIds = await User.countDocuments({
      franchiseId,
      isActive: true
    });

    // ✅ Stock Items
    const stockData = await Stock.find({ franchiseId });

    const stockItems = stockData.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    // ✅ Monthly Income
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );

    const incomeData = await Income.aggregate([
      {
        $match: {
          franchiseId,
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);

    const monthlyIncome = incomeData[0]?.total || 0;

    res.json({
      totalOrders,
      activeIds,
      stockItems,
      monthlyIncome
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};
