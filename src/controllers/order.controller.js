const mongoose = require("mongoose");
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const addBP = require('../utils/addBP');
const checkLevels = require('../utils/levelChecker');
const rewardEngine = require('../utils/rewardEngine');
const matchingIncome = require('../utils/matchingIncome');
const cloudinary = require("../config/cloudinary");
const PaymentReport = require("../models/PaymentReport");
const FranchiseStock = require("../models/FranchiseStock");

// ⭐ Order ID Generator
const generateOrderId = () => {
  return "ORD" + Date.now();
};


/**
 * CREATE ORDER
 */
exports.createOrder = async (req, res) => {
  try {

    const loginUserId = req.user.id;
    let { items, franchiseId } = req.body;

    if (typeof items === "string") {
      items = JSON.parse(items);
    }

    if (!Array.isArray(items)) {
      items = [items];
    }

    if (!items.length) {
      return res.status(400).json({ message: "No items selected" });
    }

    const loginUser = await User.findById(loginUserId);

    // ⭐⭐⭐ FINAL DECISION
    let finalFranchiseId = null;
    let orderFrom = "USER";

    if (loginUser.role === "FRANCHISE") {

      finalFranchiseId = loginUser._id;   // ⭐ VERY IMPORTANT
      orderFrom = "FRANCHISE";

    } else if (franchiseId) {

      finalFranchiseId = new mongoose.Types.ObjectId(franchiseId);
      orderFrom = "FRANCHISE";

    }

    let totalAmount = 0;
    let totalBP = 0;
    let orderItems = [];

    for (let item of items) {

      const product = await Product.findById(item.product);

      if (!product || !product.isActive) {
        return res.status(400).json({ message: "Invalid product" });
      }

      const qty = Number(item.qty) || 1;
      const price = Number(product.mrp || 0);
      const gst = Number(product.gst || 0);
      const bp = Number(product.bp || 0);

      const priceWithGST = price + (price * gst / 100);

      totalAmount += priceWithGST * qty;
      totalBP += bp * qty;

      orderItems.push({
        product: product._id,
        qty,
        price: priceWithGST,
        bp
      });
    }
    // ✅ MINIMUM ORDER VALIDATION
    if (orderFrom === "FRANCHISE" && totalAmount < 25000) {
      return res.status(400).json({
        message: "Minimum order amount for Franchise is ₹25,000"
      });
    }

    const screenshot = req.file ? req.file.path : null;

    const order = await Order.create({
      orderId: "ORD" + Date.now(),
      user: loginUserId,
      orderFrom,
      franchiseId: finalFranchiseId,   // ⭐ NOW NEVER NULL
      items: orderItems,
      totalAmount,
      totalBP,
      paymentScreenshot: screenshot,
      paymentStatus: screenshot ? "paid" : "pending",
      status: "pending"
    });

    res.json({ success: true, order });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/**
 * GET ORDERS
 */
exports.getOrders = async (req, res) => {
  try {

    const orders = await Order.find()
      .populate('user', 'fullName email mobile role')
      .populate('items.product', 'title price');

    res.json(orders);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getUserOrderStats = async (req, res) => {
  try {

    const userId = req.user.id;

    const totalOrders = await Order.countDocuments({ user: userId });

    const approvedOrders = await Order.countDocuments({
      user: userId,
      status: "approved"
    });

    const pendingOrders = await Order.countDocuments({
      user: userId,
      status: "pending"
    });

    const cancelledOrders = await Order.countDocuments({
      user: userId,
      status: "cancelled"
    });

    res.json({
      totalOrders,
      approvedOrders,
      pendingOrders,
      cancelledOrders
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserOrderDashboard = async (req, res) => {
  try {

    const userId = req.user.id;

    const stats = await Order.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },

      {
        $group: {
          _id: "$status",
          totalOrders: { $sum: 1 },
          totalBP: { $sum: "$totalBP" },
          totalAmount: { $sum: "$totalAmount" }
        }
      }
    ]);

    res.json(stats);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
/**
 * APPROVE ORDER
 */
exports.approveOrder = async (req, res) => {
  console.log("🔥 ADMIN APPROVE API HIT");
  try {

    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status === "approved")
      return res.status(400).json({ message: "Already approved" });

    if (order.paymentStatus !== "paid")
      return res.status(400).json({ message: "Payment pending" });

    // ⭐ ADMIN STOCK DEDUCT
    for (let item of order.items) {

      const product = await Product.findById(item.product);

      if (!product) throw new Error("Product missing");

      if (Number(product.stock) < Number(item.qty)) {
        throw new Error(product.title + " admin stock low");
      }

      product.stock -= Number(item.qty);
      await product.save();
    }

    // ⭐ FRANCHISE STOCK ADD
    if (order.orderFrom === "FRANCHISE" && order.franchiseId) {

      for (let item of order.items) {

        await FranchiseStock.updateOne(
          {
            franchise: order.franchiseId,
            product: item.product
          },
          {
            $inc: { quantity: Number(item.qty) }
          },
          { upsert: true }
        );

      }

    }

    order.status = "approved";
    order.approvedAt = new Date();
    await order.save();

    // ⭐ PaymentReport update
    await PaymentReport.updateOne(
      { orderId: order.orderId },
      { $set: { paymentStatus: "approved" } }
    );

    res.json({
      success: true,
      message: "Order approved + stock transferred"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {

    const franchiseId = new mongoose.Types.ObjectId(req.user.id);

    const orders = await Order.find({
      franchiseId: franchiseId
    }).sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};


exports.createFranchiseActivationOrder = async (req, res) => {
  try {
    const franchiseId = req.user.id;
    const { userUniqueId, items } = req.body;

    // 🔍 find user
    const user = await User.findOne({ uniqueId: userUniqueId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isActive) {
      return res.status(400).json({ message: "User already active" });
    }

    // 🛒 calculate items
    let totalAmount = 0;
    let totalBP = 0;
    let orderItems = [];

    for (let item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(400).json({ message: "Product invalid" });
      }

      if (product.stock < item.qty) {
        return res.status(400).json({ message: "Stock insufficient" });
      }

      totalAmount += product.price * item.qty;
      totalBP += product.bp * item.qty;

      orderItems.push({
        product: product._id,
        qty: item.qty,
        price: product.price,
        bp: product.bp
      });
    }

    const order = await Order.create({
      orderId: generateOrderId(),
      user: user._id,
      orderFrom: 'FRANCHISE',
      franchiseId,
      items: orderItems,
      totalAmount,
      totalBP,
      paymentStatus: 'paid'
    });

    res.json({
      success: true,
      order
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFranchiseOrders = async (req, res) => {
  try {

    const franchiseId = new mongoose.Types.ObjectId(req.user.id);

    const orders = await Order.find({
      franchiseId: franchiseId
    })
      .populate('user', 'fullName uniqueId')
      .populate('items.product', 'title price image');

    res.json(orders);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
