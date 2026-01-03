const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const upload = require('../middlewares/upload');

/* ================= DS REGISTER (WITH KYC DOCUMENTS) ================= */
router.post(
  '/ds/register',
  upload.fields([
    { name: 'aadhaarImage', maxCount: 1 },
    { name: 'panImage', maxCount: 1 },
    { name: 'voterImage', maxCount: 1 }
  ]),
  ctrl.registerDS
);
router.post('/login', ctrl.login);
router.post('/forgot-password', ctrl.sendForgotPasswordOTP);
router.post('/verify-otp', ctrl.verifyOTP);
router.post('/reset-password', ctrl.resetPassword);
router.get('/referral/:referralId', ctrl.getReferralUser);

module.exports = router;
