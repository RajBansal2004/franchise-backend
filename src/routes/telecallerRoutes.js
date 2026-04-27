import express from "express";
import * as ctrl from "../controllers/telecallerController.js";

const router = express.Router();

router.post("/", ctrl.create);
router.get("/", ctrl.getAll);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

export default router;