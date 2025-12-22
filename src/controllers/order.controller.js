const Order = require('../models/Order');
const Commission = require('../models/Commission');
const Franchise = require('../models/Franchise');
const Product = require('../models/Product');
const { calculateCommission } = require('../utils/commission.util');

exports.createOrder = async (req,res) => {
  try {
    const { items, franchiseId } = req.body;
    if(!items || !items.length) return res.status(400).json({ message: 'No items' });
    let total = 0;
    const populatedItems = [];
    for(const it of items){
      const product = await Product.findById(it.product);
      if(!product) return res.status(400).json({message:'Product not found'});
      populatedItems.push({ product: product._id, qty: it.qty, price: product.price });
      total += product.price * it.qty;
      // optional stock reduce
      product.stock = Math.max(0, (product.stock||0) - it.qty);
      await product.save();
    }
    const orderId = 'ORD-' + Date.now();
    const order = new Order({
      orderId,
      user: req.user._id,
      franchise: franchiseId || null,
      items: populatedItems,
      totalAmount: total,
      paymentStatus: 'pending',
      status: 'pending'
    });
    await order.save();

    if(franchiseId){
      const franchise = await Franchise.findById(franchiseId);
      if(franchise){
        const { amount, percent } = calculateCommission(total, franchise.commissionPercent || 0);
        const com = new Commission({ franchise: franchise._id, order: order._id, amount, percent });
        await com.save();
      }
    }
    res.json({ message: 'order created', order });
  } catch(err){ res.status(400).json({ error: err.message }); }
};

exports.approveOrder = async (req,res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    if(!order) return res.status(404).json({ message: 'Order not found' });
    order.status = 'approved';
    order.paymentStatus = 'paid';
    await order.save();
    res.json({ message: 'Order approved', order });
  } catch(err){ res.status(400).json({ error: err.message }); }
};

exports.getOrders = async (req,res) => {
  try {
    const q = {};
    if(req.query.status) q.status = req.query.status;
    if(req.query.franchise) q.franchise = req.query.franchise;
    // franchise role: only own orders
    if(req.user.role === 'franchise') q.franchise = req.user._id;
    const orders = await Order.find(q).populate('user').populate('franchise').limit(200);
    res.json(orders);
  } catch(err){ res.status(400).json({ error: err.message }); }
};
