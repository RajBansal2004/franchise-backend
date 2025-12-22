const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: String,
  message: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  franchise: { type: mongoose.Schema.Types.ObjectId, ref: 'Franchise', default: null },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
