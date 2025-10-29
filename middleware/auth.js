// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import pool from "../config/database.js";

/**
 * Middleware para verificar el token JWT y validar el usuario.
 * Este middleware se aplica a las rutas protegidas.
 */
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token requerido" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await pool.execute(
      "SELECT id, nombre, email, rol FROM usuarios WHERE id = ? AND activo = TRUE",
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Usuario no válido o inactivo" });
    }

    req.user = users[0];

    next();
  } catch (error) {
    console.error("Error en authenticateToken:", error.message);
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
};
