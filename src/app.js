require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const franchiseRoutes = require('./routes/franchise.routes');
const grievanceRoutes = require('./routes/grievance.routes');
const reportRoutes = require('./routes/report.routes');
const errorHandler = require('./middlewares/error.middleware');
const locationRoute =require('./routes/location.routes');
const adminRoute=require('./routes/admin.routes');
const userRoutes = require('./routes/user.routes');
require('./cron');
require('./cron/bpReset');
require('./cron/incomeReset');

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('dev')); 
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/franchises', franchiseRoutes);
app.use('/grievances', grievanceRoutes);
app.use('/reports', reportRoutes);
app.use('/location', locationRoute);
app.use('/admin', adminRoute);
app.use('/tree', require('./routes/tree.routes'));
app.use('/report', reportRoutes);
app.use('/user', userRoutes);
app.use("/uploads", express.static("uploads"));
// health
app.get('/api/health', (req,res)=> res.json({status:'ok'}));

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
});
