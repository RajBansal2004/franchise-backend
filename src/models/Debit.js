const mongoose = require("mongoose");

const debitSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["USER", "FRANCHISE", "SUBADMIN", "COMPANY"],
    required: true
  },
level: {
    type: Number,
    default: null
},
  subType: {
    type: String,
    enum: [
      "PRODUCT",
      "COMPLIANCE",
      "MARKETING",
      "OFFER",
      "MANAGEMENT",
      "FOUNDATION",
      "FOUNDER",
      "ACTIVATION",
      "REPURCHASE", 
      "MONTHLY_RETAIL_PROFIT",
      "WEEKLY_MATCHING",
      "MONTHLY_BONUS",
      "LEVEL_BONUS"

    ]
  },

  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },

  // user/franchise
  name: String,
  loginId: String,
  mobile: String,

  // subadmin
  subadminId: String,

  // company
  beneficiaryAccount: String,
  description: String,
  minusTds: {
    type: Number,
    default: 0
  },

  minusMaintenance: {
    type: Number,
    default: 0
  },

  finalAmount: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

module.exports = mongoose.model("Debit", debitSchema);