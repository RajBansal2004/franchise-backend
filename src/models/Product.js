const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({

  title: { type:String, required:true },

  sku: { type:String, required:true, unique:true },

  description: String,

  category: String,

  price: { type:Number, required:true },
franchisePrice: {
  type: Number,
  default: 0
},

  gst: { type:Number, default:0 },

  dp: { type:Number, default:0 },

  bp: { type:Number, required:true },

  stock: { type:Number, default:0 },

  repurchaseAllowed: { type:Boolean, default:true },

  incomeEligible: { type:Boolean, default:true },

  bestseller: { type:Boolean, default:false },

  image:String,       
 images:[String],
  isActive:{ type:Boolean, default:true }

},{timestamps:true});

module.exports = mongoose.model("Product", productSchema);