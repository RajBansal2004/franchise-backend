const mongoose = require("mongoose");

const paymentReportSchema = new mongoose.Schema({

  orderId:{
    type:String,
    required:true
  },

  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  },

  franchiseId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  },

  amount:Number,
  totalBP:Number,

  paymentScreenshot:String,

  paymentStatus:{
    type:String,
    enum:["pending","verified","rejected"],
    default:"pending"
  },

  verifiedBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  },

  verifiedAt:Date

},{timestamps:true});

module.exports = mongoose.model("PaymentReport",paymentReportSchema);