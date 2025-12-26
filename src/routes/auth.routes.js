const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');

router.post('/ds/register', ctrl.registerDS);
router.post('/login', ctrl.login);
router.post('/forgot-password', ctrl.sendForgotPasswordOTP);
router.post('/verify-otp', ctrl.verifyOTP);
router.post('/reset-password', ctrl.resetPassword);


module.exports = router;
