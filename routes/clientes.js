import express from "express";
import {
  getClientesActivos,
  getClientesInactivos,
  getClientesPendientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  reactivarCliente,
  getAllClientes,
} from "../controllers/clientesController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// ✅ Rutas públicas (si necesitas)
router.get("/all", getAllClientes);
router.get("/activos", getClientesActivos);
router.get("/inactivos", getClientesInactivos);
router.get("/pendientes", getClientesPendientes);

// ✅ Rutas protegidas
router.get("/:id", authenticateToken, getClienteById);
router.post("/", authenticateToken, createCliente);
router.put("/:id", authenticateToken, updateCliente);
router.delete("/:id", authenticateToken, deleteCliente);
router.put("/:id/reactivar", authenticateToken, reactivarCliente);

export default router;