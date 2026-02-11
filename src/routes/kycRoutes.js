const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const uploadKyc = require('../middlewares/upload');
const kycCtrl = require('../controllers/kycController');
const permit = require('../middlewares/role.middleware');


router.post(
  '/upload',
  auth,
  uploadKyc.fields([
    { name: 'aadhaarFront', maxCount: 1 },
    { name: 'aadhaarBack', maxCount: 1 },
    { name: 'panFront', maxCount: 1 },
    { name: 'panBack', maxCount: 1 },
    { name: 'voterFront', maxCount: 1 },
    { name: 'voterBack', maxCount: 1 }
  ]),
  kycCtrl.uploadKyc
);


/* ===== Admin Approval ===== */

router.post(
  '/approve',
  auth,
  permit('ADMIN'),
  kycCtrl.approveKyc
);

module.exports = router;
