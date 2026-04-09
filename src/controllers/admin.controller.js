const User = require('../models/User');
const Kyc = require('../models/Kyc');
const Order = require('../models/Order');
const FranchiseStock = require('../models/FranchiseStock');
const Product = require('../models/Product');
const mongoose = require("mongoose");
const { generateFranchiseId, generatePassword } = require('../utils/credentials');
const SmsLog = require('../models/SmsLog');
const { sendSMS } = require('../utils/sms');

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
      orderFrom: "USER",
      $or:[
        { franchiseId: null },
        { franchiseId: { $exists:false } }
      ]
    })
    .populate("user","fullName email uniqueId role")
    .populate("items.product","title images image price");

    res.json(orders);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFranchiseOrdersAdmin = async (req, res) => {
  try {

    const orders = await Order.find({
      orderFrom: "FRANCHISE",
      franchiseId: { $ne: null }
    })
    .populate("user","fullName email uniqueId role")
    .populate("items.product","title images image price");

    res.json(orders);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.adminApproveOrder = async (req,res)=>{

  console.log("🔥 ORDER APPROVE API HIT");

  const session = await mongoose.startSession();

  try{

    session.startTransaction();

    const order = await Order.findById(req.params.id).session(session);

    if(!order) throw new Error("Order not found");

    if(order.status === "approved") 
      throw new Error("Order already approved");

    if(order.paymentStatus !== "paid") 
      throw new Error("Payment pending");

    console.log("✅ Admin unlimited stock enabled");

    // ⭐ ONLY FRANCHISE → ADD STOCK (ONLY ONCE)
    if(order.orderFrom === "FRANCHISE" && order.franchiseId){

      const franchiseId = new mongoose.Types.ObjectId(order.franchiseId);

      for(const item of order.items){

        const productId =
          item.product?._id ? item.product._id : item.product;

        await FranchiseStock.updateOne(
          {
            franchise: franchiseId,
            product: new mongoose.Types.ObjectId(productId)
          },
          {
            $inc:{ quantity: parseInt(item.qty || 0) }
          },
          {
            upsert:true,
            session
          }
        );

      }

    }

    // ⭐ ORDER APPROVE
    order.status = "approved";
    order.approvedAt = new Date();

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success:true,
      message:"✅ Order Approved + Stock Updated"
    });

  }catch(err){

    await session.abortTransaction();
    session.endSession();

    console.log("APPROVE ERROR:",err);

    res.status(400).json({message:err.message});
  }
};