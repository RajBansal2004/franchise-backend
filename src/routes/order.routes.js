const express = require('express');
const router = express.Router();
const orderCtrl = require('../controllers/order.controller');
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');

router.post('/', auth, orderCtrl.createOrder);
router.get('/', auth, permit('ADMIN','SUBADMIN'), orderCtrl.getOrders);
router.post('/:id/approve', auth, permit('ADMIN','SUBADMIN'), orderCtrl.approveOrder);

module.exports = router;
