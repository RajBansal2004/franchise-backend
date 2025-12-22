const express = require('express');
const router = express.Router();
const orderCtrl = require('../controllers/order.controller');
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');

router.post('/', auth, orderCtrl.createOrder);
router.get('/', auth, permit('admin','subadmin','franchise'), orderCtrl.getOrders);
router.post('/:id/approve', auth, permit('admin','subadmin'), orderCtrl.approveOrder);

module.exports = router;
