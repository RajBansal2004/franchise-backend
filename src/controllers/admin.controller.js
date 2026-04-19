const User = require('../models/User');
const Kyc = require('../models/Kyc');
const Order = require('../models/Order');
const FranchiseStock = require('../models/FranchiseStock');
const Product = require('../models/Product');
const mongoose = require("mongoose");
const { generateFranchiseId, generatePassword } = require('../utils/credentials');
const SmsLog = require('../models/SmsLog');
const { sendSMS } = require('../utils/sms');
const checkLevels = require('../utils/levelChecker');
const FoundationHistory = require("../models/FoundationHistory");
const Credit = require("../models/Credit");
const Debit = require("../models/Debit");

const distributeBP = async (user, bp, session) => {
  let currentUser = user;
  let child = user;

  while (currentUser.parentId) {

    const parent = await User.findById(currentUser.parentId).session(session);
    if (!parent) break;

    // ✅ IMPORTANT: use child's position every level
    const direction = child.position;

    if (direction === "LEFT") {
      parent.leftBP = (parent.leftBP || 0) + bp;
    } else {
      parent.rightBP = (parent.rightBP || 0) + bp;
    }

    await parent.save({ session });

    await checkLevels(parent,session);

    // move upward
    child = currentUser;
    currentUser = parent;
  }
};

exports.getSmsLogs = async (req, res) => {
  const logs = await SmsLog.find()
    .sort({ createdAt: -1 })
    .limit(100);

  res.json(logs);
};
exports.createAdmin = async (req, res) => {
  try {

    const {
      fullName,
      fatherName,
      gender,
      dob,
      mobile,
      email,
      role,
      state,
      district,
      pincode,
      address,
      aadhaarNumber,
      panNumber
    } = req.body;

    if (!["ADMIN", "SUBADMIN"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const password = generatePassword();

    const uniqueId =
      role === "ADMIN"
        ? `ADM-${Date.now()}`
        : `SUB-${Date.now()}`;

    const admin = new User({

      fullName,
      fatherName,
      gender,
      dob,
      mobile,
      email,
      role,
      uniqueId,
      password,
      plainPassword: password,

      location: {
        state,
        district,
        pincode,
      },

      kycStatus: "pending",

      kycDocs: {
        aadhaar: {
          number: aadhaarNumber,
          frontImage: req.files?.aadhaarFront
            ? req.files.aadhaarFront[0].path
            : "",
          backImage: req.files?.aadhaarBack
            ? req.files.aadhaarBack[0].path
            : "",
        },

        pan: {
          number: panNumber,
          frontImage: req.files?.panImage
            ? req.files.panImage[0].path
            : "",
        },
      },
    });

    await admin.save();

    res.status(201).json({
      message: `${role} created successfully`,
      uniqueId,
      password,
      admin,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getSubadminProfile = async (req, res) => {
  try {

    const userId = req.user.id;

    const user = await User.findById(userId)
      .select(`
        fullName fatherName gender dob email mobile role uniqueId
        photo kycStatus
        location
        kycDocs
        isActive isBlocked
        createdAt
      `);

    if (!user) {
      return res.status(404).json({
        message: "Subadmin not found"
      });
    }

    if (user.role !== "SUBADMIN") {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    res.json(user);

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

exports.updateSubadminProfile = async (req, res) => {
  try {

    const userId = req.user.id;

    const {
      fullName,
      fatherName,
      mobile
    } = req.body;

    const updateData = {
      fullName,
      fatherName,
      mobile
    };

    if (req.file) {
      updateData.photo = req.file.path;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select("-password -plainPassword");

    res.json({
      message: "Profile Updated Successfully",
      user
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

/**
 * 🔹 GET ALL PENDING KYC
 */
exports.getPendingKyc = async (req, res) => {
  const list = await Kyc.find({ status: 'pending' })
    .populate('user', 'fullName email mobile role uniqueId');

  res.json(list);
};

/**
 * 🔹 APPROVE / REJECT KYC
 */
exports.updateKycStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.kycStatus = status;

    await user.save();

    res.json({
      message: `KYC ${status} successfully`,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      // USERS
      totalUsers,
      activeUsers,
      inactiveUsers,
      blockedUsers,

      // FRANCHISE
      totalFranchises,
      activeFranchises,
      inactiveFranchises,
      blockedFranchises,

      // KYC
      kycApproved,
      kycPending,
      kycRejected
    ] = await Promise.all([

      // USERS
      User.countDocuments({ role: 'USER' }),
      User.countDocuments({ role: 'USER', isActive: true, isBlocked: false }),
      User.countDocuments({ role: 'USER', isActive: false, isBlocked: false }),
      User.countDocuments({ role: 'USER', isBlocked: true }),

      // FRANCHISE
      User.countDocuments({ role: 'FRANCHISE' }),
      User.countDocuments({ role: 'FRANCHISE', isActive: true, isBlocked: false }),
      User.countDocuments({ role: 'FRANCHISE', isActive: false, isBlocked: false }),
      User.countDocuments({ role: 'FRANCHISE', isBlocked: true }),

      // KYC
      User.countDocuments({ kycStatus: 'approved' }),
      User.countDocuments({ kycStatus: 'pending' }),
      User.countDocuments({ kycStatus: 'rejected' })
    ]);

    res.json({
      success: true,
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        blocked: blockedUsers
      },
      franchises: {
        total: totalFranchises,
        active: activeFranchises,
        inactive: inactiveFranchises,
        blocked: blockedFranchises
      },
      kyc: {
        approved: kycApproved,
        pending: kycPending,
        rejected: kycRejected
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleBlockStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isBlocked } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isBlocked = isBlocked;

    if (isBlocked) {
      user.isActive = false;
    }

    await user.save();

    res.json({
      message: `User ${isBlocked ? 'Blocked' : 'Unblocked'} successfully`
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleActiveStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      message: `User ${isActive ? 'Activated' : 'Deactivated'} successfully`
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const {
      role,        // USER | FRANCHISE
      isActive,    // true | false
      isBlocked,   // true | false
      kycStatus,   // pending | approved | rejected
      page = 1,
      limit = 10,
      search
    } = req.query;

    const filter = {};

    // role wise
    if (role) filter.role = role;

    // active / inactive
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // blocked
    if (isBlocked !== undefined) {
      filter.isBlocked = isBlocked === 'true';
    }

    // kyc
    if (kycStatus) filter.kycStatus = kycStatus;

    // search
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { uniqueId: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('fullName uniqueId mobile plainPassword role isActive isBlocked kycStatus kycDocs createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),

      User.countDocuments(filter)
    ]);

    res.json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: users
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createFranchiseByAdmin = async (req, res) => {
  try {
    const {
      fullName,
      fatherName,
      gender,
      dob,
      mobile,
      email,
      pincode,
      district,
      state,
      address,
      kycType,
      kycNumber,
      franchiseName,
      ownerName
    } = req.body;

    // ✅ basic validation
    if (!fullName || !mobile) {
      return res.status(400).json({
        message: 'Full name and mobile required'
      });
    }

    const password = generatePassword();
    const franchiseId = generateFranchiseId();

    // ✅ create user
    const franchise = await User.create({
      fullName,
      fatherName,
      gender,
      dob,
      mobile,
      email,

      role: 'FRANCHISE',          // ⭐ VERY IMPORTANT
      organizationName: franchiseName, // ⭐ FIX
      uniqueId: franchiseId,        // ⭐ REQUIRED
      password: password,           // ⭐ REQUIRED
      plainPassword: password,
      franchiseName,
      franchiseOwnerName: ownerName,

      location: {
        state,
        district,
        pincode
      },

      shippingAddress: {
        addressLine: address
      }
    });


    if (kycType && kycNumber) {
      franchise.kycDocs[kycType] = {
        number: kycNumber
      };
      await franchise.save();
    }


    res.status(201).json({
      message: 'Franchise created successfully',
      franchiseId,
      password,
      franchise
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.getUserOrders = async (req, res) => {
  try {

    const orders = await Order.find({
      orderFrom: "USER"
    })
      .populate("user", "fullName email uniqueId role isActive")
      .populate("items.product", "title images image price")
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFranchiseOrdersAdmin = async (req, res) => {
  try {

    const orders = await Order.find({
      orderFrom: "FRANCHISE"   // ✅ ONLY THIS
    })
      .populate("user", "fullName email uniqueId role isActive")
      .populate("items.product", "title images image price")
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.adminApproveOrder = async (req, res) => {

  const session = await mongoose.startSession();

  let user = null;
  let parent = null;

  try {
    session.startTransaction();

    console.log("👉 Approve API HIT:", req.params.id);

    const order = await Order.findById(req.params.id).session(session);

    if (!order) throw new Error("Order not found");

    console.log("📦 Order Found:", order.orderId);

    if (order.status === "approved")
      throw new Error("Already approved");

    if (order.paymentStatus !== "paid")
      throw new Error("Payment pending");

    // ================= USER ORDER =================
    if (order.orderFrom === "USER") {

      console.log("👤 Processing USER order");

      // 🔥 GET USER FIRST (FIXED)
      user = await User.findById(order.user).session(session);
      if (!user) throw new Error("User not found");

      console.log("👤 User:", user.fullName);

      // 🔥 CALCULATE TOTAL BP
      let totalBP = 0;

      for (const item of order.items) {
        const itemBP = (item.bp || 0) * (item.qty || 0);
        totalBP += itemBP;

        console.log(`📦 Item BP: ${item.bp} × ${item.qty} = ${itemBP}`);
      }

      console.log("🔥 TOTAL BP:", totalBP);

      // ❌ MIN BP CHECK (ONLY FIRST ACTIVATION)
      if (!user.isActive && totalBP < 51) {
        throw new Error("Minimum 51 BP required for activation ❌");
      }

      // ================= 🧠 ACTIVATION LOGIC =================

      const isFirstActivation = !user.isActive;

      let usableBP = totalBP;
      let foundationBP = 0;

      if (isFirstActivation) {

        console.log("🆕 FIRST TIME ACTIVATION");

        const { activationBP } = req.body;

        if (![51, 101].includes(Number(activationBP))) {
          throw new Error("Invalid BP selected");
        }

        if (totalBP < activationBP) {
          throw new Error(`Minimum ${activationBP} BP required ❌`);
        }

        user.isActive = true;
        user.activatedBy = order.user;
        user.activationBP = activationBP;

        // 🔥 CORE SPLIT LOGIC
        if (activationBP === 51) {
          usableBP = 50;
          foundationBP = totalBP - 50;
        }

        if (activationBP === 101) {
          usableBP = 100;
          foundationBP = totalBP - 100;
        }

        if (foundationBP < 0) foundationBP = 0;

      } else {
        // NORMAL PURCHASE
        usableBP = totalBP;
        foundationBP = 0;
      }

      // ✅ SELF BP
      user.selfBP = (user.selfBP || 0) + usableBP;

      // ✅ FOUNDATION BP
      if (foundationBP > 0) {
        user.foundationBP = (user.foundationBP || 0) + foundationBP;
        // ✅ SAVE HISTORY
        const alreadyExists = await FoundationHistory.findOne({
          userId: user._id,
          orderId: order._id
        }).session(session);

        if (!alreadyExists && foundationBP > 0) {
          await FoundationHistory.create([{
            userId: user._id,
            orderId: order._id,
            fullName: user.fullName,
            uniqueId: user.uniqueId,
            mobile: user.mobile,
            bp: foundationBP
          }], { session });
        }
      }

      await user.save({ session });

      // ✅ DISTRIBUTE ONLY USABLE BP
      await distributeBP(user, usableBP, session);
    }

    // ================= FRANCHISE ORDER =================
    if (order.orderFrom === "FRANCHISE" && order.franchiseId) {

      console.log("🏢 Processing FRANCHISE order");

      for (const item of order.items) {

        const productId = item.product?._id || item.product;

        console.log("📦 Adding Stock:", productId, "Qty:", item.qty);

        await FranchiseStock.updateOne(
          {
            franchise: order.franchiseId,
            product: productId
          },
          {
            $inc: { quantity: parseInt(item.qty || 0) }
          },
          {
            upsert: true,
            session
          }
        );
      }
    }

    // ================= FINAL =================
    order.status = "approved";
    order.approvedAt = new Date();

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    console.log("✅ ORDER APPROVED SUCCESS");

    res.json({
      success: true,
      message: "Order Approved Successfully"
    });

  } catch (err) {

    await session.abortTransaction();
    session.endSession();

    console.error("❌ APPROVE ERROR:", err.message);

    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
exports.getFoundationBP = async (req, res) => {
  try {

    const { fromDate, toDate, search } = req.query;

    let filter = {};

    // 🔍 DATE FILTER
    if (fromDate || toDate) {
      filter.createdAt = {};

      if (fromDate) {
        filter.createdAt.$gte = new Date(fromDate);
      }

      if (toDate) {
        filter.createdAt.$lte = new Date(toDate + "T23:59:59");
      }
    }

    // 🔍 SEARCH FILTER
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { uniqueId: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } }
      ];
    }

    const data = await FoundationHistory.find(filter)
      .sort({ createdAt: -1 });

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTurnoverReport = async (req, res) => {
  try {

    const Order = require("../models/Order");

    // 🔥 CREDIT (incoming money)
    const creditData = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid"
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            }
          },
          totalAmount: { $sum: "$totalAmount" }
        }
      },
      {
        $project: {
          date: "$_id.date",
          totalAmount: 1,
          type: { $literal: "credit" },
          _id: 0
        }
      }
    ]);

    // 🔥 DEBIT (example: payouts / incomes)
    // agar alag collection hai (Income / Wallet etc.)
    const debitData = await Order.aggregate([
      {
        $match: {
          status: "approved"
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$approvedAt" }
            }
          },
          totalAmount: { $sum: "$totalAmount" }
        }
      },
      {
        $project: {
          date: "$_id.date",
          totalAmount: 1,
          type: { $literal: "debit" },
          _id: 0
        }
      }
    ]);

    // 🔥 MERGE
    const result = [...creditData, ...debitData].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    res.json(result);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ➕ ADD CREDIT
exports.addCredit = async (req, res) => {
  try {
    const credit = await Credit.create(req.body);
    res.json({ success: true, credit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📄 GET CREDIT
exports.getCredits = async (req, res) => {
  try {
    const { type, fromDate, toDate } = req.query;

    let filter = {};
    if (type) filter.type = type;

    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate + "T23:59:59");
    }

    const data = await Credit.find(filter).sort({ date: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ➕ ADD DEBIT
exports.addDebit = async (req, res) => {
  try {
    const debit = await Debit.create(req.body);
    res.json({ success: true, debit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📄 GET DEBIT
exports.getDebits = async (req, res) => {
  try {
    const { type, subType, fromDate, toDate } = req.query;

    let filter = {};
    if (type) filter.type = type;
    if (subType) filter.subType = subType;

    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate + "T23:59:59");
    }

    const data = await Debit.find(filter).sort({ date: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};