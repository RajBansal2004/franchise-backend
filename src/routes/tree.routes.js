const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');
const { getMyTree } = require('../controllers/tree.controller');

router.get('/my-tree', auth, permit('USER'), getMyTree);

module.exports = router;
