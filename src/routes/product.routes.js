const express = require('express');
const router = express.Router();
const productCtrl = require('../controllers/product.controller');
const auth = require('../middlewares/auth.middleware');
const permit = require('../middlewares/role.middleware');
const upload = require("../middlewares/uploadProductImage");

router.get('/', productCtrl.getProducts);
router.post('/', auth, permit('ADMIN','SUBADMIN'), upload.fields([
    { name:"image", maxCount:1 },      // thumbnail
    { name:"images", maxCount:5 }      // gallery
  ]), productCtrl.createProduct);
router.put('/:id', auth, permit('ADMIN','SUBADMIN'), productCtrl.updateProduct);
router.delete('/:id', auth, permit('ADMIN','SUBADMIN'), productCtrl.deleteProduct);
router.get('/admin', auth, permit('ADMIN'), productCtrl.getProductsAdmin);
module.exports = router;
