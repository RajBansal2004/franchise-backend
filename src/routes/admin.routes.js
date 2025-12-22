const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');

// (later we will add admin auth middleware)
router.get('/kyc/pending', ctrl.getPendingKyc);
router.put('/kyc/:kycId', ctrl.updateKycStatus);
router.post('/create-admin', ctrl.createAdmin);
module.exports = router;
