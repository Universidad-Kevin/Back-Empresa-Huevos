import express from "express";
import { getMiPerfil, updateMiPerfil, getAllUsuarios, deleteUsuario, patchEstadoUsuario } from "../controllers/usuariosController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Cualquier usuario autenticado: su propio perfil
router.get("/perfil",       authenticateToken, getMiPerfil);
router.put("/perfil",       authenticateToken, updateMiPerfil);

// Admin: gestión de usuarios
router.get("/all",          authenticateToken, requireAdmin, getAllUsuarios);
router.patch("/:id/estado", authenticateToken, requireAdmin, patchEstadoUsuario);
router.delete("/:id",       authenticateToken, requireAdmin, deleteUsuario);

export default router;
