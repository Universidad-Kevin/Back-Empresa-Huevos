import express from "express";
import {
  createPedido,
  getMisPedidos,
  getPedidoById,
  getAllPedidos,
  updateEstadoPedido,
  getPedidosPendientesCount,
} from "../controllers/pedidosController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Cliente: crear pedido y ver los propios
router.post("/", authenticateToken, createPedido);
router.get("/mis-pedidos", authenticateToken, getMisPedidos);
router.get("/:id", authenticateToken, getPedidoById);

// Admin: ver todos, cambiar estado y conteo de pendientes
router.get("/", authenticateToken, getAllPedidos);
router.get("/pendientes/count", authenticateToken, getPedidosPendientesCount);
router.put("/:id/estado", authenticateToken, updateEstadoPedido);

export default router;
