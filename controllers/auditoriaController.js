import pool from "../config/database.js";

export const getLogs = async (req, res) => {
  const limite = Math.min(parseInt(req.query.limite) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  const { accion, entidad, usuario_id } = req.query;

  let where = "WHERE 1=1";
  const params = [];

  if (accion) { where += " AND accion LIKE ?"; params.push(`%${accion}%`); }
  if (entidad) { where += " AND entidad = ?"; params.push(entidad); }
  if (usuario_id) { where += " AND a.usuario_id = ?"; params.push(usuario_id); }

  try {
    const [rows] = await pool.query(
      `SELECT a.id, a.accion, a.entidad, a.entidad_id, a.detalle, a.ip, a.creado_en,
              a.rol, u.nombre AS usuario_nombre, u.email AS usuario_email
       FROM auditoria a
       LEFT JOIN usuarios u ON a.usuario_id = u.id
       ${where}
       ORDER BY a.creado_en DESC LIMIT ${limite} OFFSET ${offset}`,
      params
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM auditoria a ${where}`,
      params
    );
    res.json({ success: true, data: rows, total });
  } catch (e) {
    console.error("getLogs:", e);
    res.status(500).json({ error: "Error del servidor" });
  }
};
