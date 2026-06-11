import { Router } from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import {
  getValoracionesProducto,
  getMiValoracion,
  crearValoracion,
  actualizarValoracion,
  eliminarValoracion,
  getTodasValoraciones,
  eliminarValoracionAdmin,
} from "../controllers/valoracionesController.js";

const router = Router();

// Público
router.get("/producto/:producto_id", getValoracionesProducto);

// Autenticado (clientes)
router.get("/producto/:producto_id/mia", authenticateToken, getMiValoracion);
router.post("/producto/:producto_id", authenticateToken, crearValoracion);
router.put("/producto/:producto_id", authenticateToken, actualizarValoracion);
router.delete("/producto/:producto_id", authenticateToken, eliminarValoracion);

// Admin
router.get("/admin", authenticateToken, requireAdmin, getTodasValoraciones);
router.delete("/admin/:id", authenticateToken, requireAdmin, eliminarValoracionAdmin);

export default router;
