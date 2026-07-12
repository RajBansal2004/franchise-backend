const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');
const upload = require("../middlewares/uploadCloudinary");
const Settings = require("../models/Settings");
const weeklyClosing = require("../utils/weeklyClosing");
const monthlyClosing = require("../utils/monthlyClosing");

router.get('/dashboard', auth, permit('ADMIN', 'SUBADMIN'), ctrl.getDashboardStats);
router.put('/user/:userId/activate', auth, permit('ADMIN', 'SUBADMIN'),  ctrl.toggleActiveStatus);
router.put('/user/:userId/block', auth, permit('ADMIN'), ctrl.toggleBlockStatus);
router.get('/users', auth, permit('ADMIN', 'SUBADMIN'), ctrl.getUsers);
router.get('/kyc/pending', auth, permit('ADMIN', 'SUBADMIN'), ctrl.getPendingKyc);
router.put('/kyc/:kycId', auth, permit('ADMIN', 'SUBADMIN'), ctrl.updateKycStatus);
router.put("/user/:id/assign-work", auth, permit('ADMIN'), ctrl.assignWorkToSubAdmin);
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
router.get("/foundation-bp", auth, ctrl.getFoundationBP);
router.get("/turnover", auth, ctrl.getTurnoverReport);
router.post("/debit",auth, ctrl.addDebit);
router.get("/debit",auth, ctrl.getDebits);
router.post("/credit",auth, ctrl.addCredit);
router.get("/credit",auth, ctrl.getCredits);
router.put("/debit/:id", ctrl.updateDebit);
router.put(
  "/user/:id",
  auth,
  permit("ADMIN"),
  ctrl.updateUserByAdmin
);
router.put(
  "/franchise/:id",
  auth,
  permit("ADMIN"),
  ctrl.updateFranchiseByAdmin
);
router.post(
  "/weekly-closing",
  auth,
  permit("ADMIN"),
  ctrl.weeklyClosing
);

router.post(
  "/monthly-closing",
  auth,
  permit("ADMIN"),
  ctrl.monthlyClosing
);
router.get("/closing-setting", auth, permit("ADMIN"), ctrl.getClosingSetting);

router.post("/closing-setting", auth, permit("ADMIN"), ctrl.updateClosingSetting);
// ✅ KYC UPDATE ROUTE
router.put("/user/:id/kyc", auth, ctrl.updateKycStatus);

router.post(
  "/run-weekly-closing",
  auth,
  permit("ADMIN"),
  async (req, res) => {
    try {
      const settings = await Settings.findOne();

      if (!settings) {
        return res.status(404).json({
          success: false,
          message: "Settings not found",
        });
      }

      console.log("🚀 MANUAL WEEKLY CLOSING STARTED");

      await weeklyClosing();

      settings.lastWeeklyClosing = new Date();
      await settings.save();

      console.log("✅ MANUAL WEEKLY CLOSING COMPLETED");

      res.json({
        success: true,
        message: "Weekly Closing Completed Successfully",
      });

    } catch (err) {
      console.log(err);

      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);
router.post(
  "/run-monthly-closing",
  auth,
  permit("ADMIN"),
  async (req, res) => {
    try {

      const settings = await Settings.findOne();

      if (!settings) {
        return res.status(404).json({
          success: false,
          message: "Settings not found",
        });
      }

      console.log("🚀 MANUAL MONTHLY CLOSING STARTED");

      await monthlyClosing();

      settings.lastMonthlyClosing = new Date();

      await settings.save();

      console.log("✅ MANUAL MONTHLY CLOSING COMPLETED");

      res.json({
        success: true,
        message: "Monthly Closing Completed Successfully",
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        success: false,
        message: err.message,
      });

    }
  }
);



module.exports = router;
