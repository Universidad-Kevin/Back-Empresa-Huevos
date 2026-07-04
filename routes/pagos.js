import express from "express";
import {
  registrarPago, getAllPagos, getPagoPorPedido,
  getVoucher, verificarPago, rechazarPago, procesarPagoCulqi,
} from "../controllers/pagosController.js";
import { authenticateToken, requireAdmin, requireAdminOrEmpleado } from "../middleware/auth.js";

const router = express.Router();

// Culqi — pago con tarjeta automático
router.post("/culqi/cargo",       authenticateToken, procesarPagoCulqi);

// Cliente
router.post("/",                  authenticateToken, registrarPago);
router.get("/pedido/:pedido_id",  authenticateToken, getPagoPorPedido);

// Empleado o admin: ver todos
router.get("/",                   authenticateToken, requireAdminOrEmpleado, getAllPagos);

// Solo admin: ver el voucher de un pago
router.get("/:id/voucher",        authenticateToken, requireAdmin, getVoucher);

// Solo admin: verificar / rechazar (decisión financiera)
router.patch("/:id/verificar",    authenticateToken, requireAdmin, verificarPago);
router.patch("/:id/rechazar",     authenticateToken, requireAdmin, rechazarPago);

export default router;
