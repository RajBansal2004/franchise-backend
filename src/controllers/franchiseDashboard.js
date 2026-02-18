const Order = require('../models/Order');
const User = require('../models/User');
const Stock = require('../models/Stock');
const Income = require('../models/Income');
const mongoose = require('mongoose');

exports.getFranchiseDashboard = async (req, res) => {
  try {
    const franchiseId = req.user.id;

    const totalOrders = await Order.countDocuments({
      franchiseId,
    });

   const activeIds = await User.countDocuments({
  isActive: true,
  activatedBy: new mongoose.Types.ObjectId(franchiseId),
});


    const franchise = await User.findById(franchiseId);

    res.json({
      totalOrders,
      activeIds,
      stockItems: franchise.stock,
      monthlyIncome: 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

