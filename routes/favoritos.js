import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { getFavoritoIds, getMisFavoritos, agregarFavorito, quitarFavorito } from "../controllers/favoritosController.js";

const router = Router();

router.get("/ids", authenticateToken, getFavoritoIds);
router.get("/", authenticateToken, getMisFavoritos);
router.post("/", authenticateToken, agregarFavorito);
router.delete("/:producto_id", authenticateToken, quitarFavorito);

export default router;
