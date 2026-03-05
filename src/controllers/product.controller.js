const Product = require('../models/Product');
const generateSku = require("../utils/generateSku");

exports.createProduct = async (req, res) => {
  try {

    let thumbnail = null;
    let gallery = [];

    if (req.files?.image) {
      thumbnail = req.files.image[0].path;
    }

    if (req.files?.images) {
      gallery = req.files.images.map(img => img.path);
    }

    const { title, bp, gst, category } = req.body;

    if (!title || !bp || !gst || !category) {
      return res.status(400).json({
        message: "title, bp, category are required"
      });
    }

    const sku = await generateSku(title);

    const product = await Product.create({
      ...req.body,
      sku,
      image: thumbnail,
      images: gallery
    });

    res.json(product);

  } catch (err) {
    res.status(500).json({ error: err.message });
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

exports.getProductsAdmin = async (req,res)=>{
 const data = await Product.find();
 res.json(data);
};

exports.getProducts = async (req,res)=>{
 const data = await Product.find({isActive:true});
 res.json(data);
};