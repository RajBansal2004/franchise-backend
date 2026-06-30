const Franchise = require('../models/Franchise');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const addBP = require("../utils/addBP");
const FranchiseStock = require("../models/FranchiseStock");
const FoundationHistory = require("../models/FoundationHistory");
const matchingIncome = require("../utils/matchingIncome");
const repurchaseIncome = require("../utils/repurchaseIncome");
const checkLevels = require('../utils/levelChecker');
const Credit = require("../models/Credit");
const Debit = require("../models/Debit");
const mongoose = require('mongoose');

const distributeBP = async (user, bp, session) => {
  let currentUser = user;

  const direction = user.rootPosition || user.position;

  while (currentUser.parentId) {
    const parent = await User.findById(currentUser.parentId).session(session);

    if (!parent) break;

    if (direction === "LEFT") {
      parent.leftBP = (parent.leftBP || 0) + bp;
      parent.weeklyLeftBP = (parent.weeklyLeftBP || 0) + bp;
      parent.monthlyLeftBP = (parent.monthlyLeftBP || 0) + bp;
    } else {
      parent.rightBP = (parent.rightBP || 0) + bp;
      parent.weeklyRightBP = (parent.weeklyRightBP || 0) + bp;
      parent.monthlyRightBP = (parent.monthlyRightBP || 0) + bp;
    }

    await parent.save({ session });

    await matchingIncome(parent._id, session);
    await checkLevels(parent, session);

    currentUser = parent;
  }
};
// ================= STOCK DEDUCT HELPER (FIXED) =================
const deductFranchiseStock = async (order, franchiseId, session) => {
  for (const item of order.items) {
    const result = await FranchiseStock.updateOne(
      {
        franchise: franchiseId,
        product: item.product,
        quantity: { $gte: Number(item.qty) },
      },
      {
        $inc: { quantity: -Number(item.qty) },
      },
      { session }
    );

    if (result.modifiedCount === 0) {
      throw new Error(
        `Stock not available for product ${item.product}`
      );
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

      if (!franchiseStock) {
        return res.status(400).json({
          message: `${product.title} stock not available`,
        });
      }

      if (Number(franchiseStock.quantity) < qty) {
        return res.status(400).json({
          message: `${product.title} only ${franchiseStock.quantity} left in stock`,
        });
      }

      const dp = Number(product.dp || 0);
      const gst = Number(product.gst || 0);
      const bp = Number(product.bp || 0);

      const taxable = gst > 0
        ? dp / (1 + gst / 100)
        : dp;

      const gstAmount = dp - taxable;

      totalAmount += dp * qty;
      totalBP += bp * qty;

      formattedItems.push({
        product: product._id,
        qty,
        dp,
        gst,
        taxable,
        gstAmount,
        bp,
      });
    }
    // Activation ke liye total BP sirf 51 ya 101 hona chahiye
    const user = await User.findById(userId);

    const order = await Order.create({
      orderId: "ORD" + Date.now(),
      user: new mongoose.Types.ObjectId(userId),
      franchiseId: new mongoose.Types.ObjectId(franchiseId),
      orderFrom: "FRANCHISE",
      saleType: "FRANCHISE_SALE",
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


    if (user.isActive) {
      // 🔥 REPURCHASE
      await deductFranchiseStock(order, order.franchiseId, session);

      await addBP(user._id, Number(order.totalBP || 0), session);
      // ✅ REPURCHASE INCOME ONLY HERE
      await repurchaseIncome(
        user._id,
        Number(order.totalBP || 0),
        session
      );
      // ==========================================
      // Franchise Retail Profit (5%)
      // ==========================================
      if (
        order.saleType === "FRANCHISE_SALE" &&
        order.franchiseId &&
        order.retailProfit === 0
      ) {
        const retailProfit = Number(order.totalAmount) * 0.05;

        order.retailProfit = retailProfit;

        const franchise = await User.findById(order.franchiseId).session(session);

        if (franchise) {
          franchise.retailProfitIncome =
            (franchise.retailProfitIncome || 0) + retailProfit;

          franchise.lifetimeRetailProfitIncome =
            (franchise.lifetimeRetailProfitIncome || 0) + retailProfit;

          franchise.totalIncome =
            (franchise.totalIncome || 0) + retailProfit;

          franchise.lifetimeTotalIncome =
            (franchise.lifetimeTotalIncome || 0) + retailProfit;

          franchise.incomeWallet =
            (franchise.incomeWallet || 0) + retailProfit;

          await franchise.save({ session });
        }
      }
      await Order.updateOne(
        { orderId },
        {
          $set: {
            paymentStatus: "paid",
            status: "approved",
            paidAt: new Date(),
            approvedAt: new Date(),
            isRepurchase: true,
            repurchaseAt: new Date(),
            retailProfit: order.retailProfit
          },
        },
        { session }
      );
      // Deduct stock immediately after payment

      await deductFranchiseStock(
        order,
        order.franchiseId,
        session
      );
      await Credit.create(
        [
          {
            type: "USER",
            incomeType: "REPURCHASE",

            userId: user._id,

            name: user.fullName,
            loginId: user.uniqueId,
            mobile: user.mobile,

            amount: order.totalAmount,
            bp: order.totalBP,

            orderId: order.orderId,

            franchiseId: order.franchiseId,

            date: new Date(),
          },
        ],
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
          status: "approved",
          paidAt: new Date(),
          approvedAt: new Date(),
          isRepurchase: true,
          repurchaseAt: new Date(),
          retailProfit: order.retailProfit
        },
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      mode: "ACTIVATION_REQUIRED",
      activationOptions: [51, 101],
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

    if (![51, 101].includes(Number(activationBP))) {
      await session.abortTransaction();

      return res.status(400).json({
        message: "Activation BP must be 51 or 101",
      });
    }

    const order = await Order.findOne({ orderId }).session(session);

    if (!order) {
      await session.abortTransaction();

      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.paymentStatus !== "paid") {
      await session.abortTransaction();

      return res.status(400).json({
        message: "Payment pending",
      });
    }

    if (order.isActivated) {
      await session.abortTransaction();

      return res.status(400).json({
        message: "Already activated",
      });
    }

    const orderBP = Number(order.totalBP || 0);

    // Order BP selected activation se kam nahi hona chahiye
    if (orderBP < Number(activationBP)) {
      await session.abortTransaction();

      return res.status(400).json({
        message: `Minimum ${activationBP} BP required.`,
      });
    }

    const user = await User.findById(order.user).session(session);

    if (!user) {
      await session.abortTransaction();

      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.isActive) {
      await session.abortTransaction();

      return res.status(400).json({
        message: "User already active. Use repurchase.",
      });
    }

    let usableBP = orderBP;
    let foundationBP = 0;

    if (Number(activationBP) === 51) {
      usableBP = 50;
      foundationBP = orderBP - 50;
    }

    if (Number(activationBP) === 101) {
      usableBP = 100;
      foundationBP = orderBP - 100;
    }

    if (foundationBP < 0) foundationBP = 0;

    user.isActive = true;
    user.activatedBy = franchiseId;
    user.activatedAt = new Date();

    user.selfBP = (user.selfBP || 0) + usableBP;
    user.foundationBP = (user.foundationBP || 0) + foundationBP;

    await user.save({ session });

    const alreadyExists = await FoundationHistory.findOne({
      userId: user._id,
      orderId: order._id
    }).session(session);

    if (!alreadyExists && foundationBP > 0) {
      await FoundationHistory.create([
        {
          userId: user._id,
          orderId: order._id,
          fullName: user.fullName,
          uniqueId: user.uniqueId,
          mobile: user.mobile,
          bp: foundationBP,
        },
      ], { session });
    }

    await distributeBP(user, usableBP, session);

    await matchingIncome(user._id, session);


    if (
      order.saleType === "FRANCHISE_SALE" &&
      order.franchiseId
    ) {
      const retailProfit = Number(order.totalAmount) * 0.05;

      order.retailProfit = retailProfit;

      const franchise = await User.findById(order.franchiseId).session(session);

      if (franchise) {
        franchise.retailProfitIncome =
          (franchise.retailProfitIncome || 0) + retailProfit;

        franchise.lifetimeRetailProfitIncome =
          (franchise.lifetimeRetailProfitIncome || 0) + retailProfit;

        franchise.totalIncome =
          (franchise.totalIncome || 0) + retailProfit;

        franchise.lifetimeTotalIncome =
          (franchise.lifetimeTotalIncome || 0) + retailProfit;

        franchise.incomeWallet =
          (franchise.incomeWallet || 0) + retailProfit;

        await franchise.save({ session });
      }
    }

    // Deduct stock only for franchise sale
    if (
      order.saleType === "FRANCHISE_SALE" &&
      order.franchiseId
    ) {
      await deductFranchiseStock(order, order.franchiseId, session);
    }

    await Credit.create([{
      type: "USER",
      incomeType: "FRANCHISE_SALE",
      userId: user._id,
      name: user.fullName,
      loginId: user.uniqueId,
      mobile: user.mobile,
      amount: Number(order.totalAmount),
      bp: Number(order.totalBP),
      orderId: order.orderId,
      franchiseId: order.franchiseId,
      date: new Date()
    }], { session });
    order.isActivated = true;
    order.activationBP = Number(activationBP);
    order.paymentStatus = "paid";
    order.status = "approved";
    order.activatedAt = new Date();
    order.approvedAt = new Date();

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      usableBP,
      foundationBP,
      message: "User ID activated successfully",
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      message: err.message,
    });
  }
};



exports.getFranchiseStock = async (req, res) => {
  try {

    const franchiseId = req.user.id;

    const stocks = await FranchiseStock.find({
      franchise: franchiseId,
      quantity: { $gt: 0 }
    })
      .populate("product");   // ⭐ VERY IMPORTANT

    const data = stocks.map(s => {

      const product = s.product || {};

      const dp = Number(product.dp || 0);
      const gst = Number(product.gst || 0);
      const bp = Number(product.bp || 0);
      const qty = Number(s.quantity || 0);

      return {
        productId: product._id,
        productName: product.title,
        dp,
        gst,
        availableQty: qty,
        bpPoint: bp,
        totalValue: dp * qty,
        totalBP: bp * qty
      };

    });

    res.json({
      success: true,
      data
    });

  } catch (err) {
    console.log("STOCK ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.createFranchise = async (req, res) => {
  try {
    const { name, contact, address, email, commissionPercent } = req.body;
    const uniqueId = 'FR-' + Date.now();
    const f = new Franchise({ name, uniqueId, contact, address, email, commissionPercent });
    await f.save();
    res.json(f);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.getFranchises = async (req, res) => {
  try {
    const fs = await Franchise.find().limit(500);
    res.json(fs);
  } catch (err) { res.status(400).json({ error: err.message }); }
};
exports.getFranchiseIncome = async (req, res) => {
  try {
    const franchiseId = req.user.id;
    const { from, to } = req.query;

    const query = {
      franchiseId,
      saleType: "FRANCHISE_SALE",
      paymentStatus: "paid",
      status: "approved",
    };

    // Date filter sirf tab lage jab dono date aaye
    if (from && to) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);

      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);

      query.approvedAt = {
        $gte: fromDate,
        $lte: toDate,
      };
    }

    const orders = await Order.find(query)
      .populate("user", "fullName uniqueId")
      .sort({ approvedAt: -1 });

    let totalIncome = 0;
    let totalBP = 0;

    const records = orders.map((order) => {
      const income = Number(order.retailProfit || 0);
      const bp = Number(order.totalBP || 0);

      totalIncome += income;
      totalBP += bp;

      return {
        _id: order._id,
        orderId: order.orderId,
        date: order.approvedAt,
        amount: income,
        bp,
        customer: order.user?.fullName || "",
        uniqueId: order.user?.uniqueId || "",
      };
    });

    return res.status(200).json({
      success: true,
      totalIncome,
      totalBP,
      records,
    });
  } catch (err) {
    console.error("Franchise Income Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
exports.updateFranchise = async (req, res) => {
  try {
    const f = await Franchise.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(f);
  } catch (err) { res.status(400).json({ error: err.message }); }
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

    // ✅ Only Admin → Franchise Purchase Orders
    const totalOrdersData = await Order.aggregate([
      {
        $match: {
          franchiseId: objectFranchiseId,
          orderFrom: "FRANCHISE",
          paymentStatus: "paid",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $match: {
          "user.role": "FRANCHISE",
        },
      },
      {
        $count: "totalOrders",
      },
    ]);

    const totalOrders = totalOrdersData[0]?.totalOrders || 0;

    // ✅ active ids
    const activeIds = await User.countDocuments({
      isActive: true,
      activatedBy: objectFranchiseId,
    });

    // ✅ 🔥 TOTAL STOCK (CORRECT WAY)
    const stockAgg = await FranchiseStock.aggregate([
      { $match: { franchise: objectFranchiseId } },
      {
        $group: {
          _id: null,
          total: { $sum: "$quantity" },
        },
      },
    ]);

    const totalStock = stockAgg[0]?.total || 0;

    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );

    const incomeAgg = await Order.aggregate([
      {
        $match: {
          franchiseId: objectFranchiseId,
          saleType: "FRANCHISE_SALE",
          status: "approved",
          paymentStatus: "paid",
          approvedAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          income: {
            $sum: "$retailProfit",
          },
        },
      },
    ]);

    const monthlyIncome = incomeAgg[0]?.income || 0;

    res.json({
      totalOrders,
      activeIds,
      stockItems: totalStock, // ✅ fixed
      monthlyIncome
    });

  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.uploadFranchiseKyc = async (req, res) => {
  try {

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "Franchise not found"
      });
    }

    user.franchiseKyc = {
      idType: req.body.idType,

      idFront: req.files?.idFront?.[0]?.path || "",
      idBack: req.files?.idBack?.[0]?.path || "",

      pan: req.files?.pan?.[0]?.path || "",
      bankPassbook:
        req.files?.bankPassbook?.[0]?.path || "",
    };

    await user.save();

    res.json({
      success: true,
      message: "KYC Uploaded Successfully",
      data: user.franchiseKyc
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};
exports.uploadLegalDocs = async (req, res) => {
  try {

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "Franchise not found"
      });
    }

    user.legalDocs = {
      fssai: req.files?.fssai?.[0]?.path || "",
      msme: req.files?.msme?.[0]?.path || "",
      udyam: req.files?.udyam?.[0]?.path || "",
      gumasta: req.files?.gumasta?.[0]?.path || "",
      centerPan: req.files?.centerPan?.[0]?.path || "",
      mca: req.files?.mca?.[0]?.path || "",
      gst: req.files?.gst?.[0]?.path || "",
    };

    await user.save();

    res.json({
      success: true,
      message: "Legal Documents Uploaded",
      data: user.legalDocs
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

exports.getFranchiseDocs = async (req, res) => {
  try {

    const user = await User.findById(req.user.id)
      .select("franchiseKyc legalDocs");

    res.json({
      franchiseKyc: user.franchiseKyc,
      legalDocs: user.legalDocs
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};