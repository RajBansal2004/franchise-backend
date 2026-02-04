const Product = require('../models/Product');

exports.createProduct = async (req,res)=>{

 try{

  let data = req.body;

  // ⭐ MULTIPLE PRODUCTS SUPPORT
  if(Array.isArray(data)){

    for(let p of data){

      if(!p.title || !p.sku || !p.price){
        return res.status(400).json({message:"Missing fields"});
      }

      const exist = await Product.findOne({sku:p.sku});
      if(exist){
        return res.status(400).json({message:`SKU ${p.sku} exists`});
      }

    }

    const products = await Product.insertMany(data);

    return res.json(products);
  }

  // ⭐ SINGLE PRODUCT SUPPORT
  const {title, sku, price} = data;

  if(!title || !sku || !price){
    return res.status(400).json({message:"Missing fields"});
  }

  const exist = await Product.findOne({sku});
  if(exist){
    return res.status(400).json({message:"SKU exists"});
  }

  const product = await Product.create(data);

  res.json(product);

 }catch(err){
  res.status(500).json({error:err.message});
 }
};


exports.updateProduct = async (req,res)=>{
 const p = await Product.findByIdAndUpdate(
   req.params.id,
   req.body,
   {new:true}
 );
 res.json(p);
};


exports.deleteProduct = async (req,res)=>{
 await Product.findByIdAndUpdate(
   req.params.id,
   {isActive:false}
 );
 res.json({message:"Product deactivated"});
};


exports.getProducts = async (req,res)=>{
 const data = await Product.find({isActive:true});
 res.json(data);
};