import pool from "../config/database.js";

// GET público: valoraciones de un producto con promedio
export const getValoracionesProducto = async (req, res) => {
  const { producto_id } = req.params;
  try {
    const [rows] = await pool.execute(
      `SELECT v.id, v.puntuacion, v.comentario, v.creado_en,
              u.nombre AS usuario_nombre
       FROM valoraciones v
       JOIN usuarios u ON v.usuario_id = u.id
       WHERE v.producto_id = ?
       ORDER BY v.creado_en DESC`,
      [producto_id]
    );

    const [[resumen]] = await pool.execute(
      `SELECT COUNT(*) AS total,
              ROUND(AVG(puntuacion), 1) AS promedio,
              SUM(puntuacion = 5) AS cinco,
              SUM(puntuacion = 4) AS cuatro,
              SUM(puntuacion = 3) AS tres,
              SUM(puntuacion = 2) AS dos,
              SUM(puntuacion = 1) AS uno
       FROM valoraciones WHERE producto_id = ?`,
      [producto_id]
    );

    res.json({ success: true, data: rows, resumen });
  } catch (e) {
    res.status(500).json({ error: "Error del servidor" });
  }
};

// GET autenticado: mi valoración para un producto
export const getMiValoracion = async (req, res) => {
  const { producto_id } = req.params;
  try {
    const [[row]] = await pool.execute(
      "SELECT * FROM valoraciones WHERE usuario_id = ? AND producto_id = ?",
      [req.user.id, producto_id]
    );
    res.json({ success: true, data: row || null });
  } catch (e) {
    res.status(500).json({ error: "Error del servidor" });
  }
};

// POST: crear valoración (solo clientes que compraron el producto con pedido entregado)
export const crearValoracion = async (req, res) => {
  const { producto_id } = req.params;
  const { puntuacion, comentario } = req.body;

  if (!puntuacion || puntuacion < 1 || puntuacion > 5) {
    return res.status(400).json({ error: "Puntuación debe ser entre 1 y 5" });
  }

  try {
    const [[compra]] = await pool.execute(
      `SELECT dp.id FROM detalle_pedidos dp
       JOIN pedidos pe ON dp.pedido_id = pe.id
       WHERE pe.usuario_id = ? AND dp.producto_id = ? AND pe.estado = 'entregado'
       LIMIT 1`,
      [req.user.id, producto_id]
    );
    if (!compra) {
      return res.status(403).json({ error: "Solo puedes valorar productos que hayas comprado y recibido" });
    }

    const [[existe]] = await pool.execute(
      "SELECT id FROM valoraciones WHERE usuario_id = ? AND producto_id = ?",
      [req.user.id, producto_id]
    );
    if (existe) {
      return res.status(409).json({ error: "Ya tienes una valoración para este producto" });
    }

    await pool.execute(
      "INSERT INTO valoraciones (usuario_id, producto_id, puntuacion, comentario) VALUES (?, ?, ?, ?)",
      [req.user.id, producto_id, puntuacion, comentario || null]
    );
    res.status(201).json({ success: true, message: "Valoración publicada" });
  } catch (e) {
    res.status(500).json({ error: "Error del servidor" });
  }
};

// PUT: editar mi valoración
export const actualizarValoracion = async (req, res) => {
  const { producto_id } = req.params;
  const { puntuacion, comentario } = req.body;

  if (!puntuacion || puntuacion < 1 || puntuacion > 5) {
    return res.status(400).json({ error: "Puntuación debe ser entre 1 y 5" });
  }

  try {
    const [result] = await pool.execute(
      "UPDATE valoraciones SET puntuacion = ?, comentario = ? WHERE usuario_id = ? AND producto_id = ?",
      [puntuacion, comentario || null, req.user.id, producto_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Valoración no encontrada" });
    }
    res.json({ success: true, message: "Valoración actualizada" });
  } catch (e) {
    res.status(500).json({ error: "Error del servidor" });
  }
};

// DELETE: eliminar mi valoración
export const eliminarValoracion = async (req, res) => {
  const { producto_id } = req.params;
  try {
    await pool.execute(
      "DELETE FROM valoraciones WHERE usuario_id = ? AND producto_id = ?",
      [req.user.id, producto_id]
    );
    res.json({ success: true, message: "Valoración eliminada" });
  } catch (e) {
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Admin: listar todas las valoraciones
export const getTodasValoraciones = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT v.id, v.puntuacion, v.comentario, v.creado_en,
              u.nombre AS usuario_nombre, u.email AS usuario_email,
              p.nombre AS producto_nombre, p.id AS producto_id
       FROM valoraciones v
       JOIN usuarios u ON v.usuario_id = u.id
       JOIN productos p ON v.producto_id = p.id
       ORDER BY v.creado_en DESC`
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Admin: eliminar cualquier valoración
export const eliminarValoracionAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute("DELETE FROM valoraciones WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Valoración no encontrada" });
    }
    res.json({ success: true, message: "Valoración eliminada" });
  } catch (e) {
    res.status(500).json({ error: "Error del servidor" });
  }
};
