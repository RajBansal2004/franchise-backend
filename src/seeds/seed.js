require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Franchise = require('../models/Franchise');
const Product = require('../models/Product');

const run = async () => {
  await connectDB(process.env.MONGO_URI);
  // create admin if not exists
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL;
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;
  let admin = await User.findOne({ email: adminEmail });
  if(!admin){
    admin = new User({ name: 'Admin', email: adminEmail, password: adminPassword, role: 'admin' });
    await admin.save();
    console.log('Admin created:', adminEmail);
  } else console.log('Admin exists');

  // sample franchise
  let fr = await Franchise.findOne({ uniqueId: /FR-/ });
  if(!fr){
    fr = new Franchise({ name: 'Sample Franchise', uniqueId: 'FR-' + Date.now(), contact: '9999999999', address: 'Sample address', commissionPercent: 10 });
    await fr.save();
    console.log('Sample franchise created');
  }

  // sample product
  let p = await Product.findOne({ sku: 'SKU-001' });
  if(!p){
    p = new Product({ title: 'Sample Product', sku: 'SKU-001', description: 'Sample', price: 499, stock: 100 });
    await p.save();
    console.log('Sample product created');
  }

  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });
