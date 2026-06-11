import { Router } from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { validarCupon, getAllCupones, crearCupon, actualizarCupon, eliminarCupon } from "../controllers/cuponesController.js";

const router = Router();

// Cliente: validar cupón en checkout
router.get("/validar",  authenticateToken, validarCupon);

// Admin: gestión de cupones
router.get("/",         authenticateToken, requireAdmin, getAllCupones);
router.post("/",        authenticateToken, requireAdmin, crearCupon);
router.put("/:id",      authenticateToken, requireAdmin, actualizarCupon);
router.delete("/:id",   authenticateToken, requireAdmin, eliminarCupon);

export default router;
