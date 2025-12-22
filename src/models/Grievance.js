const mongoose = require('mongoose');

const grievanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: String,
  message: String,
  status: { type: String, enum: ['open','in_progress','resolved'], default: 'open' },
  history: [{ note: String, by: String, at: Date }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Grievance', grievanceSchema);
