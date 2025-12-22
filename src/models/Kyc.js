const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref:'User' },

  aadhaar: String,
  pan: String,
  passport: String,

  status: {
    type:String,
    enum:['pending','approved','rejected'],
    default:'pending'
  }
},{ timestamps:true });

module.exports = mongoose.model('Kyc', kycSchema);
