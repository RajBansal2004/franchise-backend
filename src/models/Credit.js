const mongoose = require("mongoose");

const creditSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["USER", "FRANCHISE", "SHAREHOLDER"],
    required: true
  },

  // common
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },

  // user / franchise
  name: String,
  loginId: String,
  mobile: String,

  // shareholder only
  fatherName: String,
  nomineeName: String,
  shareCount: Number

}, { timestamps: true });

module.exports = mongoose.model("Credit", creditSchema);