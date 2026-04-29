const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/license.controller");

// 👉 USER APPLY
router.post("/apply", ctrl.applyLicense);

// 👉 ADMIN VIEW
router.get("/", ctrl.getAllLicenses);

// 👉 ADMIN UPDATE STATUS
router.put("/:id", ctrl.updateStatus);

module.exports = router;