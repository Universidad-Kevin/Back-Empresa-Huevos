import express from "express";
import {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  reactivarCliente,
  getClientesStats
} from "../controllers/clientesController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// ✅ Rutas públicas (si necesitas)
router.get("/stats", getClientesStats);

// ✅ Rutas protegidas
router.get("/", authenticateToken, getClientes);
router.get("/:id", authenticateToken, getClienteById);
router.post("/", authenticateToken, createCliente);
router.put("/:id", authenticateToken, updateCliente);
router.delete("/:id", authenticateToken, deleteCliente);
router.put("/:id/reactivar", authenticateToken, reactivarCliente);

export default router;