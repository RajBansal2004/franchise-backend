const express = require('express');
const router = express.Router();
const { getFranchiseDashboard } = require('../controllers/franchiseDashboard');
const auth = require('../middlewares/auth.middleware');
const { getProfile } = require('../controllers/user.controller');


router.get('/dashboard', auth, getFranchiseDashboard);
router.get('/profile', auth, getProfile);


module.exports = router;
