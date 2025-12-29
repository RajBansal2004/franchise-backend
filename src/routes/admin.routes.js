const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');

// 🔐 ADMIN ROUTES
router.get('/dashboard', auth, permit('ADMIN', 'SUBADMIN'), ctrl.getDashboardStats);
router.get('/users', auth, permit('ADMIN', 'SUBADMIN'), ctrl.getUsers);
router.get('/kyc/pending', auth, permit('ADMIN', 'SUBADMIN'), ctrl.getPendingKyc);
router.put('/kyc/:kycId', auth, permit('ADMIN', 'SUBADMIN'), ctrl.updateKycStatus);
router.post('/create-admin', auth, permit('ADMIN'), ctrl.createAdmin);
router.post('/franchise/create', auth, permit('ADMIN', 'SUBADMIN'), ctrl.createFranchiseByAdmin);
router.get('/sms-logs', auth, permit('ADMIN'), ctrl.getSmsLogs);


module.exports = router;
