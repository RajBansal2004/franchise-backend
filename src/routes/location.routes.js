const router = require('express').Router();
const ctrl = require('../controllers/location.controller');

router.get('/states', ctrl.getStates);
router.get('/cities/:state', ctrl.getCities);

module.exports = router;
