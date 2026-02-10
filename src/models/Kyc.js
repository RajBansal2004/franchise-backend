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
  },
  idNumber:String,
fatherName:String,
dob:Date,
gender:String,

address:{
 state:String,
 city:String,
 pincode:String,
 fullAddress:String
},

userSignature:String,
companySignature:String

},{ timestamps:true });

module.exports = mongoose.model('Kyc', kycSchema);
