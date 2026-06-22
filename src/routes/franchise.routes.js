const express = require('express');
const router = express.Router();
const franchiseCtrl = require('../controllers/franchise.controller');
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');
const upload = require('../middlewares/uploadCloudinary');
router.post('/', auth, permit('admin','subadmin'), franchiseCtrl.createFranchise);
router.get('/', auth, permit('admin','subadmin'), franchiseCtrl.getFranchises);
router.put('/:id', auth, permit('admin','subadmin'), franchiseCtrl.updateFranchise);
router.post(
  "/kyc",
  auth,
  permit("FRANCHISE"),
  upload.fields([
    { name: "idFront", maxCount: 1 },
    { name: "idBack", maxCount: 1 },
    { name: "pan", maxCount: 1 },
    { name: "bankPassbook", maxCount: 1 },
  ]),
  franchiseCtrl.uploadFranchiseKyc
);

router.post(
  "/legal-docs",
  auth,
  permit("FRANCHISE"),
  upload.fields([
    { name: "fssai", maxCount: 1 },
    { name: "msme", maxCount: 1 },
    { name: "udyam", maxCount: 1 },
    { name: "gumasta", maxCount: 1 },
    { name: "centerPan", maxCount: 1 },
    { name: "mca", maxCount: 1 },
    { name: "gst", maxCount: 1 },
  ]),
  franchiseCtrl.uploadLegalDocs
);

router.get(
  "/docs",
  auth,
  permit("FRANCHISE"),
  franchiseCtrl.getFranchiseDocs
);
module.exports = router;
