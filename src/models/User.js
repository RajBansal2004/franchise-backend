
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, enum:['male','female','other'], required: true },

  mobile: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },

  password: { type: String, required: true },

  role: {
    type: String,
    enum:['USER','FRANCHISE','ADMIN'],
    required: true
  },

  uniqueId: { type: String, unique: true },

  referralId: String,

  address: {
    state: String,
    city: String,
    fullAddress: String
  },

  kycStatus: {
    type: String,
    enum:['pending','approved','rejected'],
    default:'pending'
  }

},{ timestamps:true });

userSchema.pre('save', async function () {
  if(!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password,10);
});

userSchema.methods.comparePassword = function(pw){
  return bcrypt.compare(pw,this.password);
};

module.exports = mongoose.model('User', userSchema);
