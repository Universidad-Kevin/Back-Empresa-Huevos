import pool from "../config/database.js";

export const getFavoritoIds = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT producto_id FROM favoritos WHERE usuario_id = ?",
      [req.user.id]
    );
    res.json({ success: true, data: rows.map(r => r.producto_id) });
  } catch (e) {
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const getMisFavoritos = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.id, p.nombre, p.descripcion, p.precio, p.imagen, p.stock, p.categoria,
              f.creado_en AS agregado_en
       FROM favoritos f
       JOIN productos p ON f.producto_id = p.id
       WHERE f.usuario_id = ? AND p.estado = 'activo'
       ORDER BY f.creado_en DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const agregarFavorito = async (req, res) => {
  const { producto_id } = req.body;
  if (!producto_id) return res.status(400).json({ error: "producto_id requerido" });

  try {
    const [[prod]] = await pool.execute(
      "SELECT id FROM productos WHERE id = ? AND estado = 'activo'",
      [producto_id]
    );
    if (!prod) return res.status(404).json({ error: "Producto no encontrado" });

    await pool.execute(
      "INSERT IGNORE INTO favoritos (usuario_id, producto_id) VALUES (?, ?)",
      [req.user.id, producto_id]
    );
    res.status(201).json({ success: true, message: "Agregado a favoritos" });
  } catch (e) {
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const quitarFavorito = async (req, res) => {
  const { producto_id } = req.params;
  try {
    await pool.execute(
      "DELETE FROM favoritos WHERE usuario_id = ? AND producto_id = ?",
      [req.user.id, producto_id]
    );
    res.json({ success: true, message: "Eliminado de favoritos" });
  } catch (e) {
    res.status(500).json({ error: "Error del servidor" });
  }
};
