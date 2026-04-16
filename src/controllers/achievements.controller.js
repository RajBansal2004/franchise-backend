const Order = require("../models/Order");
const Product = require("../models/Product");
exports.getPublicStats = async (req, res) => {
  try {

    // ✅ USERS जिन्होंने purchase किया
    const users = await Order.distinct("user", {
      orderFrom: "USER",
      status: "approved"
    });

    // ✅ STATES
    const states = await Order.distinct("shippingAddress.state", {
      status: "approved"
    });

    // ✅ PRODUCTS
    const totalProducts = await Product.countDocuments();

    // ✅ CERTIFICATES (manual)
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