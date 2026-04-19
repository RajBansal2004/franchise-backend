const mongoose = require("mongoose");

const foundationHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },

  fullName: {
    type: String,
    trim: true
  },

  uniqueId: {
    type: String,
    trim: true
  },

  mobile: {
    type: String,
    trim: true
  },

  bp: {
    type: Number,
    required: true,
    min: 0
  }

}, { timestamps: true });


// 🔥 IMPORTANT: Prevent duplicate entries for same order
foundationHistorySchema.index(
  { userId: 1, orderId: 1 },
  { unique: true }
);


// 🔍 Search optimization (optional but useful)
foundationHistorySchema.index({
  fullName: "text",
  uniqueId: "text",
  mobile: "text"
});


module.exports = mongoose.model("FoundationHistory", foundationHistorySchema);