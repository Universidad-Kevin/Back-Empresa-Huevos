import express from "express";
import {
  getAllInteresados,
  getInteresadoById,
  createInteresado,
} from "../controllers/interesadoController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET /interesados — solo admin
router.get("/", authenticateToken, requireAdmin, getAllInteresados);

// GET /interesados/:id — solo admin
router.get("/:id", authenticateToken, requireAdmin, getInteresadoById);

// POST /interesados — público (formulario de contacto)
router.post("/", createInteresado);

export default router;
