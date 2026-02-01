const express = require('express');
const router = express.Router();
const productCtrl = require('../controllers/product.controller');
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');

router.get('/', productCtrl.getProducts);
router.post('/', auth, permit('ADMIN','SUBADMIN'), productCtrl.createProduct);
router.put('/:id', auth, permit('ADMIN','SUBADMIN'), productCtrl.updateProduct);
router.delete('/:id', auth, permit('ADMIN','SUBADMIN'), productCtrl.deleteProduct);

module.exports = router;
