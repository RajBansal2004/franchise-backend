const express = require('express');
const router = express.Router();
const grievanceCtrl = require('../controllers/grievance.controller');
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');

router.post('/', auth, grievanceCtrl.createGrievance);
router.get('/', auth, grievanceCtrl.getGrievances);
router.put('/:id', auth, permit('admin','subadmin'), grievanceCtrl.updateGrievance);

module.exports = router;
