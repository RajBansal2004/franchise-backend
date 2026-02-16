const mongoose = require("mongoose");
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const addBP = require('../utils/addBP');
const checkLevels = require('../utils/levelChecker');
const rewardEngine = require('../utils/rewardEngine');
const matchingIncome = require('../utils/matchingIncome');


// ⭐ Order ID Generator
const generateOrderId = () => {
  return "ORD" + Date.now();
};


/**
 * CREATE ORDER
 */
exports.createOrder = async (req,res)=>{
 try{

  const userId = req.user.id;
  let { items } = req.body;

  // ⭐ SINGLE PRODUCT SUPPORT
  if(!Array.isArray(items)){
    items = [items];
  }

  if(items.length === 0){
   return res.status(400).json({message:"No items"});
  }

  let totalAmount = 0;
  let totalBP = 0;
  let orderItems = [];

  for(let item of items){

   const product = await Product.findById(item.product);

   if(!product || !product.isActive){
    return res.status(400).json({message:"Product invalid"});
   }

   if(product.stock < item.qty){
    return res.status(400).json({message:"Stock insufficient"});
   }

   const price = product.price;
   const gst = product.gst || 0;
   const bp = product.bp;

   const priceWithGST = price + (price * gst / 100);

   totalAmount += priceWithGST * item.qty;
   totalBP += bp * item.qty;

   orderItems.push({
     product:product._id,
     qty:item.qty,
     price:priceWithGST,
     bp
   });

  }

  const order = await Order.create({
    orderId: generateOrderId(),
    user:userId,
    items:orderItems,
    totalAmount,
    totalBP
  });

  res.json(order);

 }catch(err){
  res.status(500).json({error:err.message});
 }
};


/**
 * GET ORDERS
 */
exports.getOrders = async (req,res)=>{
 try{

  const orders = await Order.find()
.populate('user','fullName email mobile role')
   .populate('items.product','title price');

  res.json(orders);

 }catch(err){
  res.status(500).json({error:err.message});
 }
};


exports.getUserOrderStats = async (req,res)=>{
 try{

  const userId = req.user.id;

  const totalOrders = await Order.countDocuments({ user:userId });

  const approvedOrders = await Order.countDocuments({
    user:userId,
    status:"approved"
  });

  const pendingOrders = await Order.countDocuments({
    user:userId,
    status:"pending"
  });

  const cancelledOrders = await Order.countDocuments({
    user:userId,
    status:"cancelled"
  });

  res.json({
    totalOrders,
    approvedOrders,
    pendingOrders,
    cancelledOrders
  });

 }catch(err){
  res.status(500).json({error:err.message});
 }
};

exports.getUserOrderDashboard = async (req,res)=>{
 try{

  const userId = req.user.id;

  const stats = await Order.aggregate([
    { $match:{ user: new mongoose.Types.ObjectId(userId) } },

    {
      $group:{
        _id:"$status",
        totalOrders:{ $sum:1 },
        totalBP:{ $sum:"$totalBP" },
        totalAmount:{ $sum:"$totalAmount" }
      }
    }
  ]);

  res.json(stats);

 }catch(err){
  res.status(500).json({error:err.message});
 }
};
/**
 * APPROVE ORDER
 */
exports.approveOrder = async (req,res)=>{

 try{

  const order = await Order.findById(req.params.id);

  if(!order){
   return res.status(404).json({message:"Order not found"});
  }

  if(order.status === "approved"){
   return res.status(400).json({message:"Already approved"});
  }

if(order.paymentStatus !== "paid"){
 return res.status(400).json({message:"Payment not completed"});
}
  // ⭐ STOCK DEDUCT
  for(let item of order.items){

   const product = await Product.findById(item.product);

   if(!product){
    return res.status(400).json({message:"Product missing"});
   }

   if(product.stock < item.qty){
    return res.status(400).json({message:"Stock insufficient"});
   }

   product.stock -= item.qty;
   await product.save();
  }

  // ⭐ BP DISTRIBUTION
  await addBP(order.user, order.totalBP);
  // ⭐ FRANCHISE RETAIL INCOME
if(order.orderFrom === "FRANCHISE" && order.retailProfit > 0){

  const franchise = await User.findById(order.franchiseId);

  if(franchise){
    franchise.incomeWallet += order.retailProfit;
    franchise.totalIncome += order.retailProfit;
    await franchise.save();
  }
}

  await matchingIncome(order.user);

  const user = await User.findById(order.user);

  await checkLevels(user);
  await rewardEngine(user);

  await user.save();

  order.status = "approved";
  order.approvedAt = new Date();

  await order.save();

  res.json({message:"Order approved"});

 }catch(err){
  res.status(500).json({error:err.message});
 }
};