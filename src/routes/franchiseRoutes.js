const express = require('express');
const router = express.Router();
const { getFranchiseDashboard } = require('../controllers/franchiseDashboard');
const auth = require('../middlewares/auth.middleware');

router.get('/dashboard', auth, getFranchiseDashboard);
router.get('/profile', auth, getProfile);


module.exports = router;
