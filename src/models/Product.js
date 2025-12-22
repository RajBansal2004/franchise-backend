const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: String,
  sku: String,
  description: String,
  category: String,
  price: Number,
  stock: Number,
  bestSeller: { type: Boolean, default: false },
  images: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
