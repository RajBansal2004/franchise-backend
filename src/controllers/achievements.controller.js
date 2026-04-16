const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

exports.getPublicStats = async (req, res) => {
  try {

    // ✅ USERS जिन्होंने purchase किया
    const users = await Order.distinct("user", {
      orderFrom: "USER",
      status: "approved"
    });

    // ✅ STATES (optimized - only state fetch)
    const userStates = await User.find(
      { _id: { $in: users } },
      { "location.state": 1 }
    );

    const statesSet = new Set();

    userStates.forEach(u => {
      if (u.location?.state) {
        statesSet.add(u.location.state);
      }
    });

    const states = Array.from(statesSet);

    // ✅ PRODUCTS
    const totalProducts = await Product.countDocuments();

    // ✅ CERTIFICATES
    const totalCertificates = 10;

    res.json({
      success: true,
      data: {
        totalUsers: users.length,
        totalStates: states.length,
        states,
        totalProducts,
        totalCertificates
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};