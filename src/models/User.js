const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({

  /* ================= BASIC PROFILE ================= */
  fullName: { type: String, required: true },
  fatherName: {
  type: String,
  trim: true,
  default: null
},
  organizationName: {
    type: String,
    required: function () {
      return this.role === 'FRANCHISE';
    }
  },

  dob: Date,
  gender: { type: String, enum:['male','female','other'] },

  mobile: { type: String, required: true },
  email: { type: String },

  uniqueId: { type: String, required: true },
  password: { type: String, required: true },

  role: {
    type: String,
    enum:['USER','FRANCHISE','ADMIN','SUBADMIN'],
    required: true,
    set: v => v.toUpperCase()
  },

  referralId: String,

  /* ================= BINARY GENEALOGY ================= */
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  position: {
    type: String,
    enum: ['LEFT', 'RIGHT']
  },

  leftChild: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  rightChild: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  level: {
    type: Number,
    default: 0
  },

  /* ================= BP & WALLET ================= */
  selfBP: { type: Number, default: 0 },
  leftBP: { type: Number, default: 0 },
  rightBP: { type: Number, default: 0 },

  incomeWallet: { type: Number, default: 0 },
  bpWallet: { type: Number, default: 0 },

  currentRank: { type: String, default: 'DIRECT_SELLER' },

  isActive: { type: Boolean, default: false }, // KYC approve ke baad

  /* ================= LOCATION ================= */
  location: {
    state: String,
    district: String,
    block: String,
    village: String,
    pincode: String
  },

  /* ================= KYC ================= */
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

  /* ================= OTP ================= */
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

/* ✅ UNIQUE INDEXES */
userSchema.index({ mobile: 1, role: 1 }, { unique: true });
userSchema.index({ uniqueId: 1, role: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
