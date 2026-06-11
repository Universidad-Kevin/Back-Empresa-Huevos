import express from "express";
import { getMarcas, createMarca, updateMarca, deleteMarca } from "../controllers/marcasController.js";
import { authenticateToken, requireAdminOrEmpleado } from "../middleware/auth.js";

const router = express.Router();

router.get("/",     getMarcas);
router.post("/",    authenticateToken, requireAdminOrEmpleado, createMarca);
router.put("/:id",  authenticateToken, requireAdminOrEmpleado, updateMarca);
router.delete("/:id", authenticateToken, requireAdminOrEmpleado, deleteMarca);

export default router;
