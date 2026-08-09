// require("dotenv").config();

// const mongoose = require("mongoose");

// const User = require("../models/User");
// const Order = require("../models/Order");
// const Credit = require("../models/Credit");
// const Debit = require("../models/Debit");
// const FoundationHistory = require("../models/FoundationHistory");
// const FranchiseStock = require("../models/FranchiseStock");
// const PaymentReport = require("../models/PaymentReport");

// async function resetDatabase() {

//     try {

//         await mongoose.connect(process.env.MONGO_URI);

//         console.log("MongoDB Connected");

//         console.log("Deleting Orders...");
//         await Order.deleteMany({});

//         console.log("Deleting Credits...");
//         await Credit.deleteMany({});

//         console.log("Deleting Debits...");
//         await Debit.deleteMany({});

//         console.log("Deleting Foundation History...");
//         await FoundationHistory.deleteMany({});

//         console.log("Deleting Franchise Stock...");
//         await FranchiseStock.deleteMany({});

//         console.log("Deleting Payment Reports...");
//         await PaymentReport.deleteMany({});

//         console.log("Deleting Users & Franchise...");

//         await User.deleteMany({
//             role: {
//                 $in: ["USER", "FRANCHISE"]
//             }
//         });

//         console.log("==================================");
//         console.log("DATABASE RESET SUCCESSFULLY");
//         console.log("==================================");

//         process.exit(0);

//     } catch (err) {

//         console.error(err);

//         process.exit(1);

//     }

// }

// resetDatabase();

require("dotenv").config();

const mongoose = require("mongoose");

async function resetDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected");

    const collections = await mongoose.connection.db.collections();

    for (const collection of collections) {
      console.log(`🗑️ Deleting ${collection.collectionName}...`);
      await collection.deleteMany({});
    }

    console.log("==================================");
    console.log("✅ ALL DATA DELETED SUCCESSFULLY");
    console.log("==================================");

    await mongoose.connection.close();
    process.exit(0);

  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

resetDatabase();