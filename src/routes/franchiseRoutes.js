const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { getProfile } = require('../controllers/user.controller');
const ctrl = require('../controllers/franchise.controller');
const permit = require('../middlewares/role.middleware');

router.get('/stock', auth, ctrl.getFranchiseStock);
router.get('/dashboard', auth, ctrl.getFranchiseDashboard);
router.get('/profile', auth, getProfile);
router.get('/search-user/:uniqueId', auth, ctrl.searchUserByUniqueId);
router.post('/activate-id', auth, permit('FRANCHISE'), ctrl.activateUserId);
router.get('/my-stock', auth, permit('FRANCHISE'), ctrl.getMyStock);





module.exports = router;
