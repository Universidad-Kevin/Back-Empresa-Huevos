import express from "express";
import {
  createPedido, getMisPedidos, getPedidoById, getAllPedidos,
  updateEstadoPedido, cancelarPedidoCliente, getPedidosPendientesCount, verificarPedidoPorCodigo,
} from "../controllers/pedidosController.js";
import { authenticateToken, requireAdmin, requireAdminOrEmpleado } from "../middleware/auth.js";

const router = express.Router();

// Cliente
router.post("/",              authenticateToken, createPedido);
router.get("/mis-pedidos",    authenticateToken, getMisPedidos);
router.post("/:id/cancelar",  authenticateToken, cancelarPedidoCliente);
router.get("/:id",            authenticateToken, getPedidoById);

// Empleado o admin: ver todos, cambiar estado, verificar, conteo
router.get("/",                      authenticateToken, requireAdminOrEmpleado, getAllPedidos);
router.get("/pendientes/count",      authenticateToken, requireAdminOrEmpleado, getPedidosPendientesCount);
router.get("/verificar/:codigo",     authenticateToken, requireAdminOrEmpleado, verificarPedidoPorCodigo);
router.put("/:id/estado",            authenticateToken, requireAdminOrEmpleado, updateEstadoPedido);

export default router;
