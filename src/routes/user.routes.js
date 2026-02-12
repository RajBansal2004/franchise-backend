const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');

router.get('/profile', auth, permit('USER'), ctrl.getUserDashboard);
router.get('/royalty/summary', auth, permit('USER'), ctrl.getRoyaltySummary);
router.get('/royalty/step-pending', auth, permit('USER'), ctrl.getStepPending);
router.post('/purchase', auth, permit('USER'), ctrl.purchaseProduct);
router.get('/dashboard', auth, ctrl.getUserDashboard);
router.put('/shipping-address', auth, ctrl.updateShippingAddress);

// Profile
router.put('/profile', auth, ctrl.updatePhoto);

// ID Card
router.get('/id-card', auth, ctrl.getIdCard);

module.exports = router;
