const mongoose = require('mongoose');

const franchiseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  uniqueId: { type: String, required: true, unique: true },
  contact: String,
  address: String,
  email: String,
  status: { type: String, enum:['active','inactive','blocked'], default: 'inactive' },
  commissionPercent: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Franchise', franchiseSchema);
