const Cart = require("../models/Cart");
const Product = require("../models/Product");

// ➕ ADD TO CART
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, qty } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let cart = await Cart.findOne({ user: userId });

    // 🆕 create cart if not exists
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [{ product: productId, qty: qty || 1 }]
      });
    } else {
      // 🔁 check if product already in cart
      const index = cart.items.findIndex(
        item => item.product.toString() === productId
      );

      if (index > -1) {
        cart.items[index].qty += qty || 1;
      } else {
        cart.items.push({ product: productId, qty: qty || 1 });
      }
    }

    await cart.save();

    res.json({
      success: true,
      message: "Added to cart",
      cart
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// 📦 GET CART
exports.getCart = async (req, res) => {
  try {

    const cart = await Cart.findOne({ user: req.user.id })
      .populate("items.product", "title price image");

    res.json(cart || { items: [] });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ❌ REMOVE ITEM
exports.removeFromCart = async (req, res) => {
  try {

    const { productId } = req.body;

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );

    await cart.save();

    res.json({
      success: true,
      message: "Item removed",
      cart
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// 🔄 UPDATE QTY
exports.updateCart = async (req, res) => {
  try {

    const { productId, qty } = req.body;

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find(
      item => item.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({ message: "Item not in cart" });
    }

    item.qty = qty;

    await cart.save();

    res.json({
      success: true,
      message: "Cart updated",
      cart
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// 🗑 CLEAR CART
exports.clearCart = async (req, res) => {
  try {

    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [] }
    );

    res.json({
      success: true,
      message: "Cart cleared"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};