import express from "express";
import {
  getInventario, entradaInventario, salidaInventario,
  ajusteInventario, updateStockMinimo, getMovimientos,
} from "../controllers/inventarioController.js";
import { authenticateToken, requireAdminOrEmpleado } from "../middleware/auth.js";

const router = express.Router();

router.get("/",                   authenticateToken, requireAdminOrEmpleado, getInventario);
router.post("/entrada",           authenticateToken, requireAdminOrEmpleado, entradaInventario);
router.post("/salida",            authenticateToken, requireAdminOrEmpleado, salidaInventario);
router.post("/ajuste",            authenticateToken, requireAdminOrEmpleado, ajusteInventario);
router.patch("/:id/stock-minimo", authenticateToken, requireAdminOrEmpleado, updateStockMinimo);
router.get("/movimientos",        authenticateToken, requireAdminOrEmpleado, getMovimientos);

export default router;
