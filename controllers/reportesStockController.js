import pool from "../config/database.js";

export const crearReporte = async (req, res) => {
  const { id: producto_id } = req.params;
  const { tipo = "poco_stock", mensaje } = req.body;
  const usuario_id = req.user.id;

  if (!["sin_stock", "poco_stock"].includes(tipo)) {
    return res.status(400).json({ error: "Tipo de reporte inválido" });
  }

  try {
    const [productos] = await pool.execute(
      "SELECT id FROM productos WHERE id = ? AND estado = 'activo'",
      [producto_id]
    );
    if (productos.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    await pool.execute(
      "INSERT INTO reportes_stock (producto_id, usuario_id, tipo, mensaje) VALUES (?, ?, ?, ?)",
      [producto_id, usuario_id, tipo, mensaje?.trim() || null]
    );

    res.json({ success: true, message: "Reporte enviado. ¡Gracias por avisarnos!" });
  } catch (err) {
    console.error("Error crearReporte:", err);
    res.status(500).json({ error: "Error al enviar el reporte" });
  }
};

export const getReportes = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT r.id, r.tipo, r.mensaje, r.estado, r.creado_en,
        p.id AS producto_id, p.nombre AS producto_nombre,
        p.codigo AS producto_codigo, p.stock AS producto_stock,
        u.nombre AS usuario_nombre, u.email AS usuario_email
      FROM reportes_stock r
      JOIN productos p ON r.producto_id = p.id
      JOIN usuarios u ON r.usuario_id = u.id
      ORDER BY FIELD(r.estado,'pendiente','revisado'), r.creado_en DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Error getReportes:", err);
    res.status(500).json({ error: "Error al obtener reportes" });
  }
};

export const marcarRevisado = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute(
      "UPDATE reportes_stock SET estado = 'revisado' WHERE id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Reporte no encontrado" });
    }
    res.json({ success: true, message: "Reporte marcado como revisado" });
  } catch (err) {
    console.error("Error marcarRevisado:", err);
    res.status(500).json({ error: "Error al actualizar el reporte" });
  }
};
