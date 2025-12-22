const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');

router.post('/ds/register', ctrl.registerDS);
router.post('/franchise/register', ctrl.registerFranchise);
router.post('/login', ctrl.login);

module.exports = router;
