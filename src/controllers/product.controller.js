const Product = require('../models/Product');

exports.createProduct = async (req,res)=>{

 try{

  let data = req.body;

  // ⭐ MULTIPLE PRODUCTS JSON (NO IMAGE)
  if(Array.isArray(data)){
    const products = await Product.insertMany(data);
    return res.json(products);
  }

  // ⭐ Extract images
  let thumbnail = null;
  let gallery = [];

  if(req.files?.image){
    thumbnail = req.files.image[0].filename;
  }

  if(req.files?.images){
    gallery = req.files.images.map(img => img.filename);
  }

  const {title, sku, price, bp} = req.body;

  if(!title || !sku || !price || !bp){
    return res.status(400).json({message:"Missing fields"});
  }

  const exist = await Product.findOne({sku});
  if(exist){
    return res.status(400).json({message:"SKU exists"});
  }

  const product = await Product.create({
    ...req.body,
    image: thumbnail,
    images: gallery
  });

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