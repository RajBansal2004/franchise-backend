const express = require("express");
const ctrl = require("../controllers/grievance.controller");

const router = express.Router();

router.post("/", ctrl.create);   
router.get("/", ctrl.getAll);    
router.put("/:id", ctrl.reply);

module.exports = router;