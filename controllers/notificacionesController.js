import pool from "../config/database.js";

// GET /notificaciones — mis notificaciones paginadas
export const getMisNotificaciones = async (req, res) => {
  const limite = Math.min(parseInt(req.query.limite) || 20, 50);
  const offset = parseInt(req.query.offset) || 0;
  try {
    const [rows] = await pool.query(
      `SELECT id, tipo, titulo, mensaje, leida, datos, creado_en
       FROM notificaciones WHERE usuario_id = ?
       ORDER BY creado_en DESC LIMIT ${limite} OFFSET ${offset}`,
      [req.user.id]
    );
    const [[{ total }]] = await pool.execute(
      "SELECT COUNT(*) AS total FROM notificaciones WHERE usuario_id = ?",
      [req.user.id]
    );
    const [[{ no_leidas }]] = await pool.execute(
      "SELECT COUNT(*) AS no_leidas FROM notificaciones WHERE usuario_id = ? AND leida = FALSE",
      [req.user.id]
    );
    res.json({ success: true, data: rows, total, no_leidas });
  } catch (e) {
    res.status(500).json({ error: "Error del servidor" });
  }
};

// GET /notificaciones/conteo — solo el conteo de no leídas (para badge en navbar)
export const getConteoNoLeidas = async (req, res) => {
  try {
    const [[{ no_leidas }]] = await pool.execute(
      "SELECT COUNT(*) AS no_leidas FROM notificaciones WHERE usuario_id = ? AND leida = FALSE",
      [req.user.id]
    );
    res.json({ success: true, no_leidas });
  } catch (e) {
    res.status(500).json({ error: "Error del servidor" });
  }
};

// PATCH /notificaciones/:id/leer
export const marcarLeida = async (req, res) => {
  try {
    await pool.execute(
      "UPDATE notificaciones SET leida = TRUE WHERE id = ? AND usuario_id = ?",
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Error del servidor" });
  }
};

// PATCH /notificaciones/leer-todas
export const marcarTodasLeidas = async (req, res) => {
  try {
    await pool.execute(
      "UPDATE notificaciones SET leida = TRUE WHERE usuario_id = ? AND leida = FALSE",
      [req.user.id]
    );
    res.json({ success: true, message: "Todas las notificaciones marcadas como leídas" });
  } catch (e) {
    res.status(500).json({ error: "Error del servidor" });
  }
};

// DELETE /notificaciones/:id
export const eliminarNotificacion = async (req, res) => {
  try {
    await pool.execute(
      "DELETE FROM notificaciones WHERE id = ? AND usuario_id = ?",
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Error del servidor" });
  }
};

// DELETE /notificaciones/limpiar — elimina las ya leídas
export const limpiarLeidas = async (req, res) => {
  try {
    const [result] = await pool.execute(
      "DELETE FROM notificaciones WHERE usuario_id = ? AND leida = TRUE",
      [req.user.id]
    );
    res.json({ success: true, eliminadas: result.affectedRows });
  } catch (e) {
    res.status(500).json({ error: "Error del servidor" });
  }
};
