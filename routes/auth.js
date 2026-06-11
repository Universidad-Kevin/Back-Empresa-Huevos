import express from "express";
import { login, register, forgotPassword, resetPassword } from "../controllers/authController.js";
import { loginRateLimit, registerRateLimit } from "../middleware/rateLimit.js";

const router = express.Router();

router.post("/login",           loginRateLimit,    login);
router.post("/register",        registerRateLimit, register);
router.post("/forgot-password", loginRateLimit,    forgotPassword);
router.post("/reset-password",                     resetPassword);

export default router;
