import express from "express";
import { crearFactura, getAllFacturas, getFacturaPorPedido, getPDF } from "../controllers/facturasController.js";
import { authenticateToken, requireAdmin, requireAdminOrEmpleado } from "../middleware/auth.js";

const router = express.Router();

// Empleado o admin: crear y ver todas
router.post("/",                  authenticateToken, requireAdminOrEmpleado, crearFactura);
router.get("/",                   authenticateToken, requireAdminOrEmpleado, getAllFacturas);

// Cliente o staff: ver/descargar su factura
router.get("/pedido/:pedido_id",  authenticateToken, getFacturaPorPedido);
router.get("/:id/pdf",            authenticateToken, getPDF);

export default router;
