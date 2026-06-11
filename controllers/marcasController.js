import pool from "../config/database.js";

export const getMarcas = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.*, COUNT(p.id) AS total_productos
       FROM marcas m
       LEFT JOIN productos p ON p.marca_id = m.id
       GROUP BY m.id
       ORDER BY m.nombre ASC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error obteniendo marcas:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const createMarca = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: "El nombre es requerido" });

    const [result] = await pool.query(
      "INSERT INTO marcas (nombre, descripcion) VALUES (?, ?)",
      [nombre.trim(), descripcion || null]
    );
    const [rows] = await pool.query("SELECT * FROM marcas WHERE id = ?", [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: "Marca creada exitosamente" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "Ya existe una marca con ese nombre" });
    console.error("Error creando marca:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const updateMarca = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: "El nombre es requerido" });

    const [result] = await pool.query(
      "UPDATE marcas SET nombre = ?, descripcion = ? WHERE id = ?",
      [nombre.trim(), descripcion || null, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Marca no encontrada" });

    const [rows] = await pool.query("SELECT * FROM marcas WHERE id = ?", [id]);
    res.json({ success: true, data: rows[0], message: "Marca actualizada exitosamente" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "Ya existe una marca con ese nombre" });
    console.error("Error actualizando marca:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const deleteMarca = async (req, res) => {
  try {
    const { id } = req.params;
    const [[{ total }]] = await pool.query(
      "SELECT COUNT(*) AS total FROM productos WHERE marca_id = ?", [id]
    );
    if (total > 0) {
      return res.status(400).json({ error: `No se puede eliminar: ${total} producto(s) usan esta marca` });
    }
    const [result] = await pool.query("DELETE FROM marcas WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Marca no encontrada" });
    res.json({ success: true, message: "Marca eliminada exitosamente" });
  } catch (error) {
    console.error("Error eliminando marca:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};
