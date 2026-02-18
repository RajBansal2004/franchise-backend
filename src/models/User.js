const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  /* ================= BASIC PROFILE ================= */
  fullName: { type: String, required: true },
  fatherName: {type: String, trim: true, default: null},
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
  plainPassword: {
  type: String,
  default: null
},

  isActive: { type: Boolean, default: true }, 
  activatedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  default: null
},

  isBlocked: { type: Boolean, default: false },
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
stock: {
  type: Number,
  default: 0
},
  position: {
    type: String,
    enum: ['LEFT', 'RIGHT']
  },

 leftChildren: [
  { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
],

rightChildren: [
  { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
],


  level: {
    type: Number,
    default: 0
  },
   franchiseName: {
  type: String,
  default: ''
},

franchiseOwnerName: {
  type: String,
  default: ''
},

  /* ================= BP & WALLET ================= */
  selfBP: { type: Number, default: 0 },
  leftBP: { type: Number, default: 0 },
  rightBP: { type: Number, default: 0 },

 /* ================= WALLET & INCOME ================= */
incomeWallet: { type: Number, default: 0 },
bpWallet: { type: Number, default: 0 },

totalWithdrawn: { type: Number, default: 0 },
weeklyIncome: { type: Number, default: 0 },
monthlyIncome: { type: Number, default: 0 },
thirdLegIncome: { type: Number, default: 0 },
royaltyIncome: { type: Number, default: 0 },
levelRewardIncome: { type: Number, default: 0 },
totalIncome: { type: Number, default: 0 },
/* ================= RANK & LEVEL ================= */
currentRank: { type: String, default: 'DIRECT_SELLER' },
rankAchievedAt: Date,
levelAchievedAt: Date,

/* ================= REWARDS ================= */
rewards: [{
  level: Number,
  name: String,
  achievedAt: Date,
  status: {
    type: String,
    enum: ['pending','approved','delivered'],
    default: 'pending'
  }
}],

/* ================= ROYALTY ================= */
royaltyEligible: {
  regional: { type: Boolean, default: false },
  state: { type: Boolean, default: false },
  national: { type: Boolean, default: false },
  international: { type: Boolean, default: false }
},



  /* ================= LOCATION ================= */
  location: {
    state: String,
    district: String,
    block: String,
    village: String,
    pincode: String
  },
// ===== Dashboard BP =====

weeklyLeftBP:{ type:Number, default:0 },
weeklyRightBP:{ type:Number, default:0 },

monthlyLeftBP:{ type:Number, default:0 },
monthlyRightBP:{ type:Number, default:0 },

// ===== Profile =====

photo: {
  type: String,
},


shippingAddress:{
  addressLine: { type: String }
},
  /* ================= KYC ================= */

kycDocs: {

  aadhaar: {
    number: String,
    frontImage: String,
    backImage: String
  },

  pan: {
    number: String,
    frontImage: String,
    backImage: String
  },

  voterId: {
    number: String,
    frontImage: String,
    backImage: String
  }

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
