const express = require('express');
const router = express.Router();

const orderCtrl = require('../controllers/order.controller');
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');


// ⭐ CREATE ORDER
router.post('/', auth, orderCtrl.createOrder);


// ⭐ GET ALL ORDERS (ADMIN)
router.get('/', auth, permit('ADMIN','SUBADMIN'), orderCtrl.getOrders);


// ⭐ USER ORDERS LIST
router.get('/my', auth, async (req,res)=>{
 try{
   const orders = await require('../models/Order')
     .find({ user:req.user.id })
     .populate('items.product','title price image');

   res.json(orders);
 }catch(err){
   res.status(500).json({error:err.message});
 }
});


// ⭐ ORDER STATS
router.get('/stats', auth, orderCtrl.getUserOrderStats);


// ⭐ ORDER DASHBOARD
router.get('/dashboard', auth, orderCtrl.getUserOrderDashboard);


// ⭐ APPROVE ORDER (ADMIN)
router.put('/:id/approve',
  auth,
  permit('ADMIN','SUBADMIN'),
  orderCtrl.approveOrder
);

router.post('/franchise-activation', auth, permit('FRANCHISE'), orderCtrl.createFranchiseActivationOrder);


module.exports = router;