const Franchise = require('../models/Franchise');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const addBP = require("../utils/addBP");
const mongoose = require('mongoose');

exports.activateUserId = async (req, res) => {
  // 🔥 BEFORE activating user

const user = await User.findById(order.user);

// total BP after purchase
const totalBP = (user.selfBP || 0) + order.totalBP;

if (totalBP < 51) {
  return res.status(400).json({
    message: "Minimum 51 BP required to activate ID"
  });
}

  try {
    const franchiseId = req.user.id;
    const { userId, quantity = 1 } = req.body;

    const franchise = await User.findById(franchiseId);
    if (!franchise || franchise.role !== "FRANCHISE") {
      return res.status(404).json({ message: "Franchise not found" });
    }

    // ✅ stock check
    if (franchise.stock < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ already active check (VERY IMPORTANT)
    if (user.activatedBy) {
      return res.status(400).json({
        message: "User already activated",
      });
    }

    // ✅ activate user
    user.isActive = true;
    user.activatedBy = franchise._id;
    await user.save();

    // ✅ deduct stock
    franchise.stock -= quantity;
    await franchise.save();

    // ✅ create order
    const order = await Order.create({
      orderId: "ORD" + Date.now(),
      user: user._id,
      orderFrom: "FRANCHISE",
      franchiseId: franchise._id,
      items: [],
      totalAmount: 0,
      totalBP: 0,
      paymentStatus: "paid",
      status: "approved",
      approvedAt: new Date()
    });

    // ✅ give BP
    await addBP(user._id, 100);

    res.json({
      success: true,
      message: "ID activated successfully",
      orderId: order.orderId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Activation failed" });
  }
};


exports.searchUserByUniqueId = async (req, res) => {
  try {
    const { uniqueId } = req.params;

    const user = await User.findOne({ uniqueId })
      .populate("parentId", "fullName uniqueId")
      .select(
        "fullName uniqueId mobile email fatherName isActive selfBP parentId"
      );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      user
    });
  } catch (err) {
    console.error("search error:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.createBill = async (req, res) => {
  try {
    const franchiseId = req.user.id;
    const { userId, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No products selected" });
    }

    let totalAmount = 0;
    let totalBP = 0;

    const orderItems = [];

   for (const it of items) {
  const product = await Product.findById(it.productId);

  if (!product) continue;

  const qty = Number(it.qty) || 1;
  const price = Number(product.price) || 0;
  const bp = Number(product.bpPoint) || 0;

  totalAmount += price * qty;
  totalBP += bp * qty;

  orderItems.push({
    product: product._id,
    productName: product.productName,
    price,
    bpPoint: bp,
    qty,
  });
}


    const orderId = "ORD" + Date.now();

    const order = await Order.create({
      orderId,
      user: userId,
      franchiseId,
      items: orderItems,
      totalAmount,
      totalBP,
      status: "pending",
      paymentStatus: "pending",
    });

    res.json({
      success: true,
      order,
    });
  } catch (err) {
    console.error("createBill error:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.completePaymentAndActivate = async (req, res) => {
  try {
    const franchiseId = req.user.id;
    const { orderId } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        message: "Payment already completed"
      });
    }

    const user = await User.findById(order.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ FINAL BP CALCULATION
    const finalBP = (user.selfBP || 0) + order.totalBP;

    if (finalBP < 51) {
      return res.status(400).json({
        message: `Minimum 51 BP required. Current total: ${finalBP}`
      });
    }

    // ✅ mark order paid
    order.paymentStatus = "paid";
    order.status = "approved";
    order.approvedAt = new Date();
    await order.save();

    // ✅ add BP
    await addBP(user._id, order.totalBP);

    // ✅ activate user (only once)
    if (!user.activatedBy) {
      user.isActive = true;
      user.activatedBy = franchiseId;
      await user.save();
    }

    // ✅ deduct franchise stock
    const franchise = await User.findById(franchiseId);
    if (franchise) {
      franchise.stock = Math.max(0, (franchise.stock || 0) - order.items.length);
      await franchise.save();
    }

    res.json({
      success: true,
      message: "Payment done & ID activated"
    });

  } catch (err) {
    console.error("completePayment error:", err);
    res.status(500).json({ message: "Process failed" });
  }
};

exports.activateUserAfterPayment = async (req, res) => {
  try {
    const franchiseId = req.user.id;
    const { orderId } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const user = await User.findById(order.user);

    const finalBP = (user.selfBP || 0) + order.totalBP;

    if (finalBP < 51) {
      return res.status(400).json({
        message: `Minimum 51 BP required. Current: ${finalBP}`,
      });
    }

    // ✅ mark paid
    order.paymentStatus = "paid";
    order.status = "approved";
    await order.save();

    // ✅ add BP
    await addBP(user._id, order.totalBP);

    // ✅ activate
    user.isActive = true;
    user.activatedBy = franchiseId;
    await user.save();

    res.json({
      success: true,
      message: "User activated successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


exports.getFranchiseStock = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .select('title price bp stock gst');

    const formatted = products.map(p => ({
      productId: p._id,
      productName: p.title,
      price: p.price,
      availableQty: p.stock,
      bpPoint: p.bp,
      totalValue: p.price * p.stock,
      totalBP: p.bp * p.stock
    }));

    res.json({
      success: true,
      count: formatted.length,
      data: formatted
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createFranchise = async (req,res) => {
  try {
    const { name, contact, address, email, commissionPercent } = req.body;
    const uniqueId = 'FR-' + Date.now();
    const f = new Franchise({ name, uniqueId, contact, address, email, commissionPercent });
    await f.save();
    res.json(f);
  } catch(err){ res.status(400).json({ error: err.message }); }
};

exports.getFranchises = async (req,res) => {
  try {
    const fs = await Franchise.find().limit(500);
    res.json(fs);
  } catch(err){ res.status(400).json({ error: err.message }); }
};

exports.updateFranchise = async (req,res) => {
  try {
    const f = await Franchise.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(f);
  } catch(err){ res.status(400).json({ error: err.message }); }
};

exports.getMyStock = async (req, res) => {
  try {
    const franchise = await User.findById(req.user.id);

    res.json({
      stock: franchise.stock || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getFranchiseDashboard = async (req, res) => {
  try {
    const franchiseId = req.user.id;
    const objectFranchiseId = new mongoose.Types.ObjectId(franchiseId);

    // ✅ total orders
    const totalOrders = await Order.countDocuments({
      franchiseId: objectFranchiseId,
    });

    // ✅ active ids
    const activeIds = await User.countDocuments({
      isActive: true,
      activatedBy: objectFranchiseId,
    });

    // ✅ franchise data
    const franchise = await User.findById(objectFranchiseId);

    res.json({
      totalOrders,
      activeIds,
      stockItems: franchise?.stock || 0,
      monthlyIncome: 0,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: err.message });
  }
};

