const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({

  fullName: { type: String, required: true },
  dob: Date,
  gender: { type: String, enum:['male','female','other'] },

  mobile: { type: String, required: true },
  email: { type: String },

  uniqueId: { type: String, required: true }, // RB9770256051 / FRN-12CHARS
  password: { type: String, required: true },

  role: {
    type: String,
    enum:['USER','FRANCHISE','ADMIN','SUBADMIN'],
    required: true,
    set: v => v.toUpperCase()
  },

  referralId: String,

  location: {
    state: String,
    district: String,
    block: String,
    village: String,
    pincode: String
  },

  kycDocs: {
    aadhaar: String,
    voterId: String,
    drivingLicence: String
  },
  kycStatus: {
    type: String,
    enum:['pending','approved','rejected'],
    default:'pending'
  },

  otp: {
    code: String,
    expiresAt: Date
  }

},{ timestamps:true });

/* 🔐 PASSWORD HASH */
userSchema.pre('save', async function () {
  if(!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password,10);
});

userSchema.methods.comparePassword = function(pw){
  return bcrypt.compare(pw,this.password);
};

/* ✅ COMPOUND UNIQUE INDEXES (MOST IMPORTANT) */
userSchema.index({ mobile: 1, role: 1 }, { unique: true });
userSchema.index({ uniqueId: 1, role: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
