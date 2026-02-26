const express = require("express");
const router = express.Router();
const categoryCtrl = require("../controllers/category.controller");
const auth = require("../middlewares/auth.middleware");
const permit = require("../middlewares/role.middleware");

router.get("/", categoryCtrl.getCategories);
router.post("/", auth, permit("ADMIN","SUBADMIN"), categoryCtrl.createCategory);

module.exports = router;