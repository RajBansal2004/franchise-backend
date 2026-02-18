const Franchise = require('../models/Franchise');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

exports.activateUserId = async (req, res) => {
  try {
    const { userId, quantity } = req.body;
    const franchiseId = req.user.id;

    const franchise = await User.findById(franchiseId);
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (franchise.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock' });
    }

    // ✅ Get activation product (first active product)
    const product = await Product.findOne({ isActive: true });

    if (!product) {
      return res.status(400).json({ message: 'Product not found' });
    }

    // ✅ calculate
    const priceWithGST =
      product.price + (product.price * (product.gst || 0)) / 100;

    const totalAmount = priceWithGST * quantity;
    const totalBP = product.bp * quantity;

    // ✅ create order
    const order = await Order.create({
      orderId: 'ORD' + Date.now(),
      user: user._id,
      orderFrom: 'FRANCHISE',
      franchiseId,
      items: [
        {
          product: product._id,
          qty: quantity,
          price: priceWithGST,
          bp: product.bp
        }
      ],
      totalAmount,
      totalBP,
      paymentStatus: 'paid'
    });

    // ✅ deduct franchise stock
    franchise.stock -= quantity;
    await franchise.save();

    // ✅ activate user
    if (!user.isActive) {
      user.isActive = true;
      await user.save();
    }

    res.json({
      success: true,
      message: 'ID activated & product sold',
      order
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.searchUserByUniqueId = async (req, res) => {
  try {
    const { uniqueId } = req.params;

    const user = await User.findOne({ uniqueId }).select(
      'uniqueId fullName mobile email isActive'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user
    });

  } catch (err) {
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



