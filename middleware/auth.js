import jwt from "jsonwebtoken";
import pool from "../config/database.js";

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Token requerido" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await pool.execute(
      "SELECT id, nombre, email, rol, password_changed_at FROM usuarios WHERE id = ? AND activo = TRUE",
      [decoded.userId]
    );

    if (users.length === 0) return res.status(401).json({ error: "Usuario no válido o inactivo" });

    // Invalidar token si la contraseña fue cambiada después de que se emitió
    const u = users[0];
    if (u.password_changed_at) {
      const changedAt = Math.floor(new Date(u.password_changed_at).getTime() / 1000);
      if (decoded.iat < changedAt) {
        return res.status(401).json({ error: "Sesión expirada. Por favor inicia sesión de nuevo." });
      }
    }

    req.user = u;
    next();
  } catch (error) {
    console.error("Error en authenticateToken:", error.message);
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.rol !== "admin") {
    return res.status(403).json({ error: "Acceso solo para administradores" });
  }
  next();
};

// Empleados pueden gestionar operaciones del día a día (productos, pedidos, inventario, pagos).
// Solo admin puede gestionar usuarios, clientes, cupones, estadísticas, auditoría y configuración.
export const requireAdminOrEmpleado = (req, res, next) => {
  if (!req.user || !["admin", "empleado"].includes(req.user.rol)) {
    return res.status(403).json({ error: "Acceso restringido al personal" });
  }
  next();
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
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};
