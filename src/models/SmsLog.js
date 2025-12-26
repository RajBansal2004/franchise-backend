const mongoose = require('mongoose');

const smsLogSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  purpose: {
    type: String,
    enum: ['OTP', 'CREDENTIALS', 'ALERT'],
    required: true
  },

  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED'],
    required: true
  },

  provider: {
    type: String,
    default: 'FAST2SMS'
  },

  response: {
    type: Object
  }

}, { timestamps: true });

module.exports = mongoose.model('SmsLog', smsLogSchema);
