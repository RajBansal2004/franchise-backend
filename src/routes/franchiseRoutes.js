const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const ctrlUser = require('../controllers/user.controller');
const ctrl = require('../controllers/franchise.controller');
const permit = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload');

router.get('/stock', auth, permit('FRANCHISE'), ctrl.getFranchiseStock);
router.get('/dashboard', auth, ctrl.getFranchiseDashboard);
router.get('/profile', auth, ctrlUser.getProfile);
router.put('/profile', auth, upload.single('photo'), ctrlUser.updatePhoto);
router.get('/search-user/:uniqueId', auth, ctrl.searchUserByUniqueId);
router.get('/my-stock', auth, permit('FRANCHISE'), ctrl.getMyStock);
router.post('/create-bill', auth, permit('FRANCHISE'), ctrl.createBill);
router.post("/activate-id", auth, permit("FRANCHISE"), ctrl.completePaymentOnly);
router.post("/final-activate", auth, permit("FRANCHISE"), ctrl.activateUserId);





module.exports = router;
