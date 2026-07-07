import express from "express";
import { getConfiguracion, updateConfiguracion } from "../controllers/configuracionController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getConfiguracion);
router.put("/", authenticateToken, requireAdmin, updateConfiguracion);

export default router;
