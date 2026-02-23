const mongoose = require("mongoose");

const franchiseStockSchema = new mongoose.Schema({
  franchise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Franchise",
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

franchiseStockSchema.index({ franchise: 1, product: 1 }, { unique: true });

module.exports = mongoose.model("FranchiseStock", franchiseStockSchema);