const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const addBP = require('../utils/addBP');
const checkLevels = require('../utils/levelChecker');
const rewardEngine = require('../utils/rewardEngine');


exports.createOrder = async (req,res)=>{
 try{

  const userId = req.user.id;
  const { items } = req.body;

  if(!items || items.length === 0){
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
   const bp = product.bp;

   totalAmount += price * item.qty;
   totalBP += bp * item.qty;

   orderItems.push({
     product:product._id,
     qty:item.qty,
     price,
     bp
   });

  }

  const order = await Order.create({
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
exports.getOrders = async (req,res)=>{
 try{

  const orders = await Order.find()
   .populate('user','name email')
   .populate('items.product','name price');

  res.json(orders);

 }catch(err){
  res.status(500).json({error:err.message});
 }
};
exports.approveOrder = async (req,res)=>{

 try{

  const order = await Order.findById(req.params.id);

  if(!order){
   return res.status(404).json({message:"Order not found"});
  }

  if(order.status === "approved"){
   return res.status(400).json({message:"Already approved"});
  }

  // STOCK DEDUCT
  for(let item of order.items){

   const product = await Product.findById(item.product);

   if(product.stock < item.qty){
    return res.status(400).json({message:"Stock insufficient"});
   }

   product.stock -= item.qty;
   await product.save();
  }

  // BP DISTRIBUTE
  await addBP(order.user, order.totalBP);

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