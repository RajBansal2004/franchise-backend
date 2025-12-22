const express = require('express');
const router = express.Router();
const franchiseCtrl = require('../controllers/franchise.controller');
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');

router.post('/', auth, permit('admin','subadmin'), franchiseCtrl.createFranchise);
router.get('/', auth, permit('admin','subadmin'), franchiseCtrl.getFranchises);
router.put('/:id', auth, permit('admin','subadmin'), franchiseCtrl.updateFranchise);

module.exports = router;
