const Franchise = require('../models/Franchise');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const addBP = require("../utils/addBP");
const FranchiseStock = require("../models/FranchiseStock");
const mongoose = require('mongoose');

// ================= STOCK DEDUCT HELPER (FIXED) =================
const deductFranchiseStock = async (order, franchiseId, session) => {

  for (const item of order.items) {

    const result = await FranchiseStock.updateOne(
      {
        franchise: franchiseId,
        product: item.product,
        quantity: { $gte: Number(item.qty) }
      },
      {
        $inc: { quantity: -Number(item.qty) }
      },
      { session }
    );

    if (result.modifiedCount === 0) {
      throw new Error("Franchise stock not available");
    }
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
    const formattedItems = [];

  for (const it of items) {

  const product = await Product.findById(it.productId);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const qty = Number(it.qty) || 1; // ✅ FIRST define qty

  // ✅ check franchise stock
  const franchiseStock = await FranchiseStock.findOne({
    franchise: franchiseId,
    product: product._id,
  });

  if (!franchiseStock || franchiseStock.quantity < qty) {
    return res.status(400).json({
      message: `${product.title} stock not available in franchise`
    });
  }

  const price = Number(product.price) || 0;
  const bp = Number(product.bp) || 0;

  totalAmount += price * qty;
  totalBP += bp * qty;

  formattedItems.push({
    product: product._id,
    qty,
    price,
    bp,
  });
}

    const order = await Order.create({
      orderId: "ORD" + Date.now(),
      user: new mongoose.Types.ObjectId(userId),
      franchiseId: new mongoose.Types.ObjectId(franchiseId),
      orderFrom: "FRANCHISE",
      items: formattedItems,
      totalAmount,
      totalBP,
      paymentStatus: "pending",
      status: "pending",
    });

    res.json({ success: true, order });

  } catch (err) {
    console.error("Create Bill Error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.completePaymentOnly = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { orderId } = req.body;

    const order = await Order.findOne({ orderId }).session(session);
    if (!order) throw new Error("Order not found");
    if (order.paymentStatus === "paid") throw new Error("Already paid");

    const user = await User.findById(order.user).session(session);
    if (!user) throw new Error("User not found");

    // ✅ ALWAYS FIRST deduct franchise stock
    await deductFranchiseStock(order, order.franchiseId, session);

    if (user.isActive) {
      // 🔥 REPURCHASE

      await addBP(user._id, Number(order.totalBP || 0), session);

      await Order.updateOne(
        { orderId },
        {
          $set: {
            paymentStatus: "paid",
            status: "paid",
            paidAt: new Date(),
            isRepurchase: true,
            repurchaseAt: new Date(),
          },
        },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return res.json({
        success: true,
        mode: "REPURCHASE",
        message: "Repurchase payment successful",
      });
    }

    // 🔥 ACTIVATION REQUIRED

    await Order.updateOne(
      { orderId },
      {
        $set: {
          paymentStatus: "paid",
          status: "paid",
          paidAt: new Date(),
        },
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      mode: "ACTIVATION_REQUIRED",
      activationOptions: [51, 100],
      message: "Payment successful. Please select activation BP.",
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: err.message });
  }
};

exports.activateUserId = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const franchiseId = req.user.id;
    const { orderId, activationBP } = req.body;

    if (![51, 100].includes(Number(activationBP))) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Activation BP must be 51 or 100",
      });
    }

    const order = await Order.findOne({ orderId }).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentStatus !== "paid") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Payment pending" });
    }

    if (order.isActivated) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Already activated" });
    }

    const user = await User.findById(order.user).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: "User not found" });
    }

    // 🔥 if already active → block
    if (user.isActive) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "User already active. Use repurchase.",
      });
    }

    // ✅ ONLY ACTIVATE (NO BP ADD)
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          isActive: true,
          activatedBy: franchiseId,
          activatedAt: new Date(),
        },
      },
      { session }
    );

    // ✅ mark order activated
    await Order.updateOne(
      { orderId },
      {
        $set: {
          isActivated: true,
          activationBP: Number(activationBP),
          activatedAt: new Date(),
        },
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "User ID activated successfully",
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: err.message });
  }
};

exports.getFranchiseStock = async (req, res) => {
  try {
    const franchiseId = req.user.id;

    const stock = await FranchiseStock.find({
      franchise: franchiseId
    }).populate("product", "title price bp");

    const formatted = stock.map(s => ({
      productId: s.product?._id,
      productName: s.product?.title,
      price: s.product?.price,
      bpPoint: s.product?.bp,
      availableQty: s.quantity
    }));

    res.json({
      success: true,
      count: formatted.length,
      data: formatted
    });

  } catch (err) {
    console.error("Franchise stock error:", err);
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
    const franchiseId = new mongoose.Types.ObjectId(req.user.id);

    const totalQty = await FranchiseStock.aggregate([
      { $match: { franchise: franchiseId } },
      {
        $group: {
          _id: null,
          total: { $sum: "$quantity" },
        },
      },
    ]);

    res.json({
      totalStock: totalQty[0]?.total || 0,
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

