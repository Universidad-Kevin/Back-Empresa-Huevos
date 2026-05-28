import express from "express";
import { getMiPerfil, getMisPedidos, getPedidoById, createPedidoMayorista, enviarContacto } from "../controllers/mayoristaController.js";
import { authenticateMayorista, authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Rutas del portal mayorista (requieren token mayorista)
router.get("/perfil", authenticateMayorista, getMiPerfil);
router.get("/pedidos", authenticateMayorista, getMisPedidos);
router.get("/pedidos/:id", authenticateMayorista, getPedidoById);

// Contacto directo al admin
router.post("/contacto", authenticateMayorista, enviarContacto);

// Crear pedido mayorista (solo admin)
router.post("/pedidos", authenticateToken, createPedidoMayorista);

export default router;
