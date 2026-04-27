const express = require("express");
const ctrl = require("../controllers/emailController");

const router = express.Router();

router.post("/", ctrl.create);
router.get("/", ctrl.getAll);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;