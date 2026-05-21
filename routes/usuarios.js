import express from "express";
import { getMiPerfil, updateMiPerfil } from "../controllers/usuariosController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/perfil", authenticateToken, getMiPerfil);
router.put("/perfil", authenticateToken, updateMiPerfil);

export default router;
