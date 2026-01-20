const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');

router.get('/profile', auth, permit('USER'), ctrl.getUserDashboard);
router.get('/royalty/summary',  ctrl.getRoyaltySummary);

module.exports = router;
