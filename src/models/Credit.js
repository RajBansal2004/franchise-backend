const mongoose = require("mongoose");

const creditSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["USER", "FRANCHISE", "SHAREHOLDER"],
    required: true
  },
   // 🔥 NEW FIELD (IMPORTANT)
  incomeType: {
    type: String,
    enum: ["MATCHING", "LEVEL", "ROYALTY", "DIRECT"],
  },

  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

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
  shareCount: Number,
  remark: String

}, { timestamps: true });

module.exports = mongoose.model("Credit", creditSchema);