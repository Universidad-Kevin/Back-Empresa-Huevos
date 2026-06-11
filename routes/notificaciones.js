import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  getMisNotificaciones,
  getConteoNoLeidas,
  marcarLeida,
  marcarTodasLeidas,
  eliminarNotificacion,
  limpiarLeidas,
} from "../controllers/notificacionesController.js";

const router = Router();

router.use(authenticateToken);

router.get("/", getMisNotificaciones);
router.get("/conteo", getConteoNoLeidas);
router.patch("/leer-todas", marcarTodasLeidas);
router.delete("/limpiar", limpiarLeidas);
router.patch("/:id/leer", marcarLeida);
router.delete("/:id", eliminarNotificacion);

export default router;
