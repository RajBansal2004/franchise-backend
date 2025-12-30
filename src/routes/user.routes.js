const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');

router.get('/dashboard', auth, permit('USER', 'FRANCHISE'), ctrl.getUserDashboard);

module.exports = router;
