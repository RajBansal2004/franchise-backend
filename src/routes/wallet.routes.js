const express = require('express');
const router = express.Router();
const walletCtrl = require('../controllers/wallet.controller');

router.get('/balance', walletCtrl.getWallet);

module.exports = router;
