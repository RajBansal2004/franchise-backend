const express = require("express");
const router = express.Router();
const cartCtrl = require("../controllers/cart.controller");
const auth = require("../middlewares/auth.middleware");

// ➕ ADD
router.post("/", auth, cartCtrl.addToCart);

// 📦 GET
router.get("/", auth, cartCtrl.getCart);

// ❌ REMOVE
router.delete("/", auth, cartCtrl.removeFromCart);

// 🔄 UPDATE
router.put("/", auth, cartCtrl.updateCart);

// 🗑 CLEAR
router.delete("/clear", auth, cartCtrl.clearCart);

module.exports = router;