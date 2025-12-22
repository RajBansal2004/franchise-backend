const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  franchise: { type: mongoose.Schema.Types.ObjectId, ref: 'Franchise', default: null },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    qty: Number,
    price: Number
  }],
  totalAmount: Number,
  paymentStatus: { type: String, enum:['pending','paid','failed'], default: 'pending' },
  status: { type: String, enum:['pending','approved','cancelled','returned','delivered'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  activatedId: { type: String }
});

module.exports = mongoose.model('Order', orderSchema);
