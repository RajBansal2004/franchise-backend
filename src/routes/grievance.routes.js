const express = require("express");
const grievanceCtrl = require("../controllers/grievance.controller");

const router = express.Router();

router.get("/", grievanceCtrl.getAll);
router.put("/:id", grievanceCtrl.reply);

module.exports = router;