const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
  {
    franchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },

    productName: {
      type: String,
      required: true
    },

    quantity: {
      type: Number,
      default: 0
    },

    purchasePrice: {
      type: Number,
      default: 0
    },

    mrp: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Stock', stockSchema);
