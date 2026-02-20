const Franchise = require('../models/Franchise');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const addBP = require("../utils/addBP");
const mongoose = require('mongoose');

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

    // ✅ MUST declare here
    let totalAmount = 0;
    let totalBP = 0;
    const formattedItems = []; // ⭐⭐⭐ IMPORTANT

    // ================= LOOP =================
    for (const it of items) {
      const product = await Product.findById(it.productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const qty = Number(it.qty) || 1;
      const price = Number(product.price) || 0;
      const bp = Number(product.bp) || 0; // ⭐ FIXED (bp not bpPoint)

      const lineTotal = price * qty;
      const lineBP = bp * qty;

      totalAmount += lineTotal;
      totalBP += lineBP;
if (product.stock < qty) {
  return res.status(400).json({
    message: `${product.title} stock insufficient`
  });
}
      formattedItems.push({
        product: product._id,
        qty,
        price,
        bp,
      });
    }

    // ================= SAFETY =================
    if (isNaN(totalBP)) totalBP = 0;
    if (isNaN(totalAmount)) totalAmount = 0;

    // ================= CREATE ORDER =================
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

    res.json({
      success: true,
      order,
    });

  } catch (err) {
    console.error("Create Bill Error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.completePaymentAndActivate = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const franchiseId = req.user.id;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "OrderId required" });
    }

    const order = await Order.findOne({ orderId }).session(session);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        message: "Payment already completed"
      });
    }

    const user = await User.findById(order.user).session(session);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ BP CHECK
    const finalBP =
      Number(user.selfBP || 0) + Number(order.totalBP || 0);

    if (finalBP < 51) {
      return res.status(400).json({
        message: `Minimum 51 BP required. Current total: ${finalBP}`
      });
    }

    // ================= ORDER UPDATE =================
    await Order.updateOne(
      { orderId },
      {
        $set: {
          paymentStatus: "paid",
          status: "approved",
          approvedAt: new Date(),
        },
      },
      { session }
    );

    // ================= ADD BP =================
    await addBP(user._id, Number(order.totalBP || 0));

    // ================= ACTIVATE USER =================
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          isActive: true,
          activatedBy: franchiseId,
        },
      },
      { session }
    );

    // ================= PRODUCT STOCK DEDUCT =================
    let totalQty = 0;

    for (const item of order.items) {
      const qty = Number(item.qty || 0);

      totalQty += qty;

      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: -qty } },
        { session }
      );
    }

    // ================= FRANCHISE STOCK DEDUCT =================
    await User.updateOne(
      { _id: franchiseId },
      { $inc: { stock: -totalQty } },
      { session }
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: "Payment done & ID activated",
    });

  } catch (err) {
    await session.abortTransaction();
    console.error("completePayment error:", err);
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
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

