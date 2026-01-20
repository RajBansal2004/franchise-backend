const Order = require('../models/Order');
const User = require('../models/User');

const addBP = require('../utils/addBP');
const checkLevels = require('../utils/levelChecker');
const rewardEngine = require('../utils/rewardEngine');

/**
 * CREATE ORDER (User / Franchise)
 */
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { products, totalAmount, totalBP } = req.body;

    if (!products || !totalAmount || !totalBP) {
      return res.status(400).json({ message: 'Invalid order data' });
    }

    const order = await Order.create({
      user: userId,
      products,
      totalAmount,
      totalBP,
      status: 'pending'
    });

    res.status(201).json({
      message: 'Order placed successfully',
      order
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET ALL ORDERS (Admin / Franchise)
 */
exports.getOrders = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === 'FRANCHISE') {
      filter.user = req.user.id;
    }

    const orders = await Order.find(filter)
      .populate('user', 'fullName mobile uniqueId')
      .sort({ createdAt: -1 });

    res.json({ orders });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * APPROVE ORDER (Admin / SubAdmin)
 * 👉 YAHI SE BP + LEVEL + REWARD TRIGGER HOGA
 */
exports.approveOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'approved') {
      return res.status(400).json({ message: 'Order already approved' });
    }

    order.status = 'approved';
    order.approvedAt = new Date();
    await order.save();

    // 🔥 BP DISTRIBUTION
    await addBP(order.user, order.totalBP);

    const user = await User.findById(order.user);

    // 🔥 LEVEL & REWARD CHECK
    await checkLevels(user);
    rewardEngine(user);

    await user.save();

    res.json({
      message: 'Order approved & BP credited'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
