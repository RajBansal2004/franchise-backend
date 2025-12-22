const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  franchise: { type: mongoose.Schema.Types.ObjectId, ref: 'Franchise' },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  amount: Number,
  percent: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Commission', commissionSchema);
