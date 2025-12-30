const router = require('express').Router();
const reportController = require('../controllers/report.controller');
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');

router.get(
  '/registrations',
  auth,
  permit('ADMIN', 'SUBADMIN'),
  reportController.registrationReport
);

router.get(
  '/kyc',
  auth,
  permit('ADMIN', 'SUBADMIN'),
  reportController.kycReport
);

module.exports = router;
