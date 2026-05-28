import express from "express";
import { getMiPerfil, updateMiPerfil, getAllUsuarios, deleteUsuario } from "../controllers/usuariosController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/all", authenticateToken, getAllUsuarios);
router.delete("/:id", authenticateToken, deleteUsuario);
router.get("/perfil", authenticateToken, getMiPerfil);
router.put("/perfil", authenticateToken, updateMiPerfil);

export default router;
