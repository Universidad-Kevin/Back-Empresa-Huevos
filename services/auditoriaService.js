import pool from "../config/database.js";

// Registro no-bloqueante — nunca detiene el flujo principal
// opts.usuario_id / opts.rol sobreescriben req.user cuando el usuario aún no está en la request (ej. login)
export const registrar = (req, accion, entidad = null, entidad_id = null, detalle = null, opts = {}) => {
  const usuario_id = opts.usuario_id ?? req?.user?.id ?? null;
  const rol = opts.rol ?? req?.user?.rol ?? null;
  const ip = req?.ip ?? req?.socket?.remoteAddress ?? null;

  pool.execute(
    "INSERT INTO auditoria (usuario_id, rol, accion, entidad, entidad_id, detalle, ip) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [usuario_id, rol, accion, entidad, entidad_id, detalle ? JSON.stringify(detalle) : null, ip]
  ).catch(e => console.warn("auditoria insert:", e.message));
};
