import express from "express";
import { getCarrito, syncCarrito, clearCarritoDB } from "../controllers/carritoController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticateToken, getCarrito);
router.post("/sync", authenticateToken, syncCarrito);
router.delete("/", authenticateToken, clearCarritoDB);

export default router;
