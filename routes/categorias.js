import express from "express";
import { getCategorias, createCategoria, updateCategoria, deleteCategoria } from "../controllers/categoriasController.js";
import { authenticateToken, requireAdminOrEmpleado } from "../middleware/auth.js";

const router = express.Router();

router.get("/",     getCategorias);
router.post("/",    authenticateToken, requireAdminOrEmpleado, createCategoria);
router.put("/:id",  authenticateToken, requireAdminOrEmpleado, updateCategoria);
router.delete("/:id", authenticateToken, requireAdminOrEmpleado, deleteCategoria);

export default router;
