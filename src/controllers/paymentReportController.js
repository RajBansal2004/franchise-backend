const PaymentReport = require("../models/PaymentReport");
const Order = require("../models/Order");

exports.verifyPayment = async (req,res)=>{

 try{

   const report = await PaymentReport.findById(req.params.id);

   if(!report){
     return res.status(404).json({message:"Report not found"});
   }

   report.paymentStatus = "verified";
   report.verifiedBy = req.user.id;
   report.verifiedAt = new Date();

   await report.save();

   await Order.updateOne(
     {orderId: report.orderId},
     {
       paymentStatus:"paid",
       status:"approved"
     }
   );

   res.json({message:"Payment Verified Successfully"});

 }catch(err){
   res.status(500).json({error:err.message});
 }

};


exports.getAllPaymentReports = async (req,res)=>{

 try{

   const data = await PaymentReport.find()
     .populate("user","fullName uniqueId")
     .populate("franchiseId","franchiseOwnerName");

   res.json(data);

 }catch(err){
   res.status(500).json({error:err.message});
 }

};


exports.getMyIncomeReport = async (req,res)=>{

 try{

   const data = await PaymentReport.find({
     franchiseId:req.user.id,
     paymentStatus:"verified"
   });

   res.json(data);

 }catch(err){
   res.status(500).json({error:err.message});
 }

};