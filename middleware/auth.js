import jwt from "jsonwebtoken";
import pool from "../config/database.js";

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Token requerido" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await pool.execute(
      "SELECT id, nombre, email, rol FROM usuarios WHERE id = ? AND activo = TRUE",
      [decoded.userId]
    );

    if (users.length === 0) return res.status(401).json({ error: "Usuario no válido o inactivo" });

    req.user = users[0];
    next();
  } catch (error) {
    console.error("Error en authenticateToken:", error.message);
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
};

export const authenticateMayorista = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Token requerido" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.tabla !== "clientes" || decoded.rol !== "mayorista") {
      return res.status(403).json({ error: "Acceso solo para clientes mayoristas" });
    }

    const [rows] = await pool.execute(
      "SELECT id, nombre_empresa, contacto_nombre, email, ruc, telefono, direccion, limite_credito, estado FROM clientes WHERE id = ? AND estado = 'activo'",
      [decoded.userId]
    );

    if (rows.length === 0) return res.status(401).json({ error: "Cliente no válido o inactivo" });

    req.cliente = { ...rows[0], rol: "mayorista" };
    next();
  } catch (error) {
    console.error("Error en authenticateMayorista:", error.message);
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
};
