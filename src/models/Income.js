const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema(
  {
    franchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    amount: {
      type: Number,
      required: true
    },

    type: {
      type: String,
      enum: [
        'Retail Profit',
        'Direct Income',
        'Binary Income',
        'Level Income'
      ],
      default: 'Retail Profit'
    },

    remark: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Income', incomeSchema);
