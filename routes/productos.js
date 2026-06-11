import express from "express";
import {
  getProductos, getProductoById, createProducto, updateProducto,
  deleteProducto, getAllProductos, getProductosInactivos, reactivarProducto, patchEstadoProducto,
  uploadImagenProducto,
} from "../controllers/productosController.js";
import { authenticateToken, requireAdmin, requireAdminOrEmpleado } from "../middleware/auth.js";
import { crearReporte, getReportes, marcarRevisado } from "../controllers/reportesStockController.js";
import { uploadImagen, handleUploadError } from "../middleware/upload.js";

const router = express.Router();

// Públicas
router.get("/activos",  getProductos);
router.get("/all",      getAllProductos);
router.get("/inactivos", getProductosInactivos);
router.get("/:id",      getProductoById);

// Empleado o admin: gestión de productos e inventario
router.post("/",                           authenticateToken, requireAdminOrEmpleado, createProducto);
router.put("/:id",                         authenticateToken, requireAdminOrEmpleado, updateProducto);
router.patch("/:id/estado",                authenticateToken, requireAdminOrEmpleado, patchEstadoProducto);
router.put("/:id/reactivar",               authenticateToken, requireAdminOrEmpleado, reactivarProducto);
router.post("/:id/reportar-stock",         authenticateToken, requireAdminOrEmpleado, crearReporte);
router.get("/reportes-stock",              authenticateToken, requireAdminOrEmpleado, getReportes);
router.put("/reportes-stock/:id/revisar",  authenticateToken, requireAdminOrEmpleado, marcarRevisado);

// Subir imagen de producto
router.post("/:id/imagen", authenticateToken, requireAdminOrEmpleado, uploadImagen, handleUploadError, uploadImagenProducto);

// Solo admin: eliminar producto
router.delete("/:id", authenticateToken, requireAdmin, deleteProducto);

export default router;
