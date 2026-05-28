import express from "express";
import {
  createPedido,
  getMisPedidos,
  getPedidoById,
  getAllPedidos,
  updateEstadoPedido,
  cancelarPedidoCliente,
  getPedidosPendientesCount,
  verificarPedidoPorCodigo,
} from "../controllers/pedidosController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Cliente: crear pedido, ver los propios, cancelar
router.post("/", authenticateToken, createPedido);
router.get("/mis-pedidos", authenticateToken, getMisPedidos);
router.post("/:id/cancelar", authenticateToken, cancelarPedidoCliente);
router.get("/:id", authenticateToken, getPedidoById);

// Admin: ver todos, cambiar estado, verificar por código y conteo
router.get("/", authenticateToken, getAllPedidos);
router.get("/pendientes/count", authenticateToken, getPedidosPendientesCount);
router.get("/verificar/:codigo", authenticateToken, verificarPedidoPorCodigo);
router.put("/:id/estado", authenticateToken, updateEstadoPedido);

export default router;
