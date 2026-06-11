import express from "express";
import {
  getProveedores, getProveedorById, createProveedor,
  updateProveedor, patchEstadoProveedor, deleteProveedor,
} from "../controllers/proveedoresController.js";
import { authenticateToken, requireAdminOrEmpleado } from "../middleware/auth.js";

const router = express.Router();

router.get("/",             authenticateToken, requireAdminOrEmpleado, getProveedores);
router.get("/:id",          authenticateToken, requireAdminOrEmpleado, getProveedorById);
router.post("/",            authenticateToken, requireAdminOrEmpleado, createProveedor);
router.put("/:id",          authenticateToken, requireAdminOrEmpleado, updateProveedor);
router.patch("/:id/estado", authenticateToken, requireAdminOrEmpleado, patchEstadoProveedor);
router.delete("/:id",       authenticateToken, requireAdminOrEmpleado, deleteProveedor);

export default router;
