const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    name: String,
    email: String,
    mobile: String,
    subject: String,
    message: String,
    answer: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Email", schema);   // ✅ IMPORTANT