require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Franchise = require('../models/Franchise');
const Product = require('../models/Product');

const run = async () => {
  await connectDB(process.env.MONGO_URI);

  // =========================
  // CREATE ADMIN
  // =========================
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL;
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;

  let admin = await User.findOne({ email: adminEmail });

  if (!admin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    admin = await User.create({
      fullName: 'Super Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      uniqueId: `ADM-${Date.now()}`,
      mobile: '9999999999',
      gender: 'other',
      dob: new Date('1995-01-01'),
      kycStatus: 'approved'
    });

    console.log('✅ Admin created:', adminEmail);
  } else {
    console.log('ℹ️ Admin already exists');
  }

  // =========================
  // SAMPLE FRANCHISE
  // =========================
  let fr = await Franchise.findOne({ uniqueId: /FR-/ });
  if (!fr) {
    fr = await Franchise.create({
      name: 'Sample Franchise',
      uniqueId: 'FR-' + Date.now(),
      contact: '9999999999',
      address: 'Sample address',
      commissionPercent: 10
    });
    console.log('✅ Sample franchise created');
  }

  // =========================
  // SAMPLE PRODUCT
  // =========================
  let p = await Product.findOne({ sku: 'SKU-001' });
  if (!p) {
    p = await Product.create({
      title: 'Sample Product',
      sku: 'SKU-001',
      description: 'Sample product',
      price: 499,
      stock: 100
    });
    console.log('✅ Sample product created');
  }

  process.exit(0);
};

run().catch(err => {
  console.error('❌ Seed error:', err.message);
  process.exit(1);
});
