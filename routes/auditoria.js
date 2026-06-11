import express from "express";
import { getLogs } from "../controllers/auditoriaController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticateToken, requireAdmin, getLogs);

export default router;
