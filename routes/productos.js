import express from "express";
import {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  getAllProductos,
  getProductosInactivos,
  reactivarProducto,
} from "../controllers/productosController.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  crearReporte,
  getReportes,
  marcarRevisado,
} from "../controllers/reportesStockController.js";

const router = express.Router();

// Rutas estáticas antes de /:id para evitar conflictos
router.get("/activos", getProductos);
router.get("/all", getAllProductos);
router.get("/inactivos", getProductosInactivos);
router.get("/reportes-stock", authenticateToken, getReportes);

router.get("/:id", getProductoById);

router.post("/", authenticateToken, createProducto);
router.put("/:id", authenticateToken, updateProducto);
router.delete("/:id", authenticateToken, deleteProducto);
router.put("/:id/reactivar", authenticateToken, reactivarProducto);
router.post("/:id/reportar-stock", authenticateToken, crearReporte);
router.put("/reportes-stock/:id/revisar", authenticateToken, marcarRevisado);

export default router;
