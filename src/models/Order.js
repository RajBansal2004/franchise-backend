const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({

  orderId: { type: String, required: true, unique: true },

  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
orderFrom: {
  type: String,
  enum: ['USER','FRANCHISE'],
  default: 'USER'
},

franchiseId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  default: null
},

retailProfit: {
  type: Number,
  default: 0
}
,
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    qty: Number,
    price: Number,
    bp: Number
  }],

  totalAmount: Number,

  totalBP: Number,

  paymentStatus: {
    type: String,
    enum:['pending','paid','failed'],
    default: 'pending'
  },

  status: {
    type: String,
    enum:['pending','approved','cancelled'],
    default: 'pending'
  },

  approvedAt: Date,

  createdAt: { type: Date, default: Date.now }

});
// 🔥 PERFORMANCE INDEXES
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ franchiseId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);