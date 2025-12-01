import express from "express";
import {
  getAllInteresados,
  getInteresadoById,
  createInteresado,
} from "../controllers/interesadoController.js";

const router = express.Router();

// GET /interesados
router.get("/", getAllInteresados);

// GET /interesados/:id
router.get("/:id", getInteresadoById);

// POST /interesados
router.post("/", createInteresado);

export default router;
