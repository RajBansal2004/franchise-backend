const express = require('express');
const router = express.Router();
const reportCtrl = require('../controllers/report.controller');
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');

router.get('/orders', auth, permit('admin','subadmin'), reportCtrl.ordersReport);

module.exports = router;
