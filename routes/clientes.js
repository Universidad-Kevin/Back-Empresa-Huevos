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
  patchEstadoCliente,
} from "../controllers/clientesController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/all",              authenticateToken, requireAdmin, getAllClientes);
router.get("/activos",          authenticateToken, requireAdmin, getClientesActivos);
router.get("/inactivos",        authenticateToken, requireAdmin, getClientesInactivos);
router.get("/pendientes",       authenticateToken, requireAdmin, getClientesPendientes);
router.get("/:id",              authenticateToken, requireAdmin, getClienteById);
router.post("/",                authenticateToken, requireAdmin, createCliente);
router.put("/:id",              authenticateToken, requireAdmin, updateCliente);
router.patch("/:id/estado",     authenticateToken, requireAdmin, patchEstadoCliente);
router.delete("/:id",           authenticateToken, requireAdmin, deleteCliente);
router.put("/:id/reactivar",    authenticateToken, requireAdmin, reactivarCliente);
router.post("/:id/credenciales",authenticateToken, requireAdmin, asignarCredenciales);

export default router;
