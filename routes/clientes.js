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
  asignarCredenciales,
} from "../controllers/clientesController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Rutas protegidas de listado
router.get("/all", authenticateToken, getAllClientes);
router.get("/activos", authenticateToken, getClientesActivos);
router.get("/inactivos", authenticateToken, getClientesInactivos);
router.get("/pendientes", authenticateToken, getClientesPendientes);

// ✅ Rutas protegidas
router.get("/:id", authenticateToken, getClienteById);
router.post("/", authenticateToken, createCliente);
router.put("/:id", authenticateToken, updateCliente);
router.delete("/:id", authenticateToken, deleteCliente);
router.put("/:id/reactivar", authenticateToken, reactivarCliente);
router.post("/:id/credenciales", authenticateToken, asignarCredenciales);

export default router;