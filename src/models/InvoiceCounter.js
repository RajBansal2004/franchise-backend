const mongoose = require("mongoose");

const invoiceCounterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
    },

    sequence: {
      type: Number,
      default: 6,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "InvoiceCounter",
  invoiceCounterSchema
);