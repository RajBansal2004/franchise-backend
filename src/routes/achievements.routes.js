const express = require("express");
const router = express.Router();
const dashboardCtrl = require("../controllers/achievements.controller");

router.get("/stats", dashboardCtrl.getPublicStats);

module.exports = router;