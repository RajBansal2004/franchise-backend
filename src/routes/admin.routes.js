const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');
const upload = require("../middlewares/uploadCloudinary");


router.get('/dashboard', auth, permit('ADMIN', 'SUBADMIN'), ctrl.getDashboardStats);
router.put('/user/:userId/activate', auth, permit('ADMIN', 'SUBADMIN'),  ctrl.toggleActiveStatus);
router.put('/user/:userId/block', auth, permit('ADMIN'), ctrl.toggleBlockStatus);
router.get('/users', auth, permit('ADMIN', 'SUBADMIN'), ctrl.getUsers);
router.get('/kyc/pending', auth, permit('ADMIN', 'SUBADMIN'), ctrl.getPendingKyc);
router.put('/kyc/:kycId', auth, permit('ADMIN', 'SUBADMIN'), ctrl.updateKycStatus);
router.post(
  "/create-admin",
  auth,
  permit("ADMIN"),
  upload.fields([
    { name: "aadhaarFront", maxCount: 1 },
    { name: "aadhaarBack", maxCount: 1 },
    { name: "panImage", maxCount: 1 },
  ]),
  ctrl.createAdmin
);
router.get(
  "/subadmin/profile",
  auth,
  permit("SUBADMIN","ADMIN"),
  ctrl.getSubadminProfile
);

router.put(
  "/subadmin/profile",
  auth,
  permit("SUBADMIN"),
  upload.single("photo"),
  ctrl.updateSubadminProfile
);

router.post('/franchise/create', auth, permit('ADMIN', 'SUBADMIN'), ctrl.createFranchiseByAdmin);
router.get('/sms-logs', auth, permit('ADMIN'), ctrl.getSmsLogs);
router.get("/user-orders", auth, ctrl.getUserOrders);
router.get("/franchise-orders", auth, ctrl.getFranchiseOrdersAdmin);
router.put("/approve/:id", auth, ctrl.adminApproveOrder);
// ✅ KYC UPDATE ROUTE
router.put("/user/:id/kyc", auth, ctrl.updateKycStatus);


module.exports = router;
