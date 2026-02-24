// const mongoose = require('mongoose');

// const connectDB = async (uri) => {
//   try {
//     mongoose.set('strictQuery', false);
//     await mongoose.connect(uri, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log('MongoDB connected');
//      console.log("📌 Database Name:", conn.connection.name);
//   console.log("🌍 Host:", conn.connection.host);
//   } catch (err) {
//     console.error('MongoDB connection error:', err);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;

const mongoose = require('mongoose');

const connectDB = async (uri) => {
  try {
    mongoose.set('strictQuery', false);

    const conn = await mongoose.connect(uri);

    console.log('✅ MongoDB Connected');
    console.log('📌 Database Name:', conn.connection.name);
    console.log('🌍 Host:', conn.connection.host);

  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;