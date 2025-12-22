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

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/franchises', franchiseRoutes);
app.use('/api/grievances', grievanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/location', locationRoute);
app.use('/api/admin', adminRoute);


// health
app.get('/api/health', (req,res)=> res.json({status:'ok'}));

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
});
