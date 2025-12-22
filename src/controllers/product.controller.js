const Product = require('../models/Product');

exports.createProduct = async (req,res) => {
  try {
    const p = new Product(req.body);
    await p.save();
    res.json(p);
  } catch(err){ res.status(400).json({ error: err.message }); }
};

exports.updateProduct = async (req,res) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(p);
  } catch(err){ res.status(400).json({ error: err.message }); }
};

exports.deleteProduct = async (req,res) => {
  try { await Product.findByIdAndDelete(req.params.id); res.json({message:'deleted'}); } catch(err){ res.status(400).json({ error: err.message}); }
};

exports.getProducts = async (req,res) => {
  try {
    const products = await Product.find().limit(100);
    res.json(products);
  } catch(err){ res.status(400).json({ error: err.message }); }
};
