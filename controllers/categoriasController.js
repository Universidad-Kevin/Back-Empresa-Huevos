import pool from "../config/database.js";

export const getCategorias = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, COUNT(p.id) AS total_productos
       FROM categorias c
       LEFT JOIN productos p ON p.categoria_id = c.id
       GROUP BY c.id
       ORDER BY c.nombre ASC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error obteniendo categorías:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const createCategoria = async (req, res) => {
  try {
    const { nombre, descripcion, color } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: "El nombre es requerido" });

    const [result] = await pool.query(
      "INSERT INTO categorias (nombre, descripcion, color) VALUES (?, ?, ?)",
      [nombre.trim(), descripcion || null, color || "#6c757d"]
    );
    const [rows] = await pool.query("SELECT * FROM categorias WHERE id = ?", [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: "Categoría creada exitosamente" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "Ya existe una categoría con ese nombre" });
    console.error("Error creando categoría:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const updateCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, color } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: "El nombre es requerido" });

    const [result] = await pool.query(
      "UPDATE categorias SET nombre = ?, descripcion = ?, color = ? WHERE id = ?",
      [nombre.trim(), descripcion || null, color || "#6c757d", id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Categoría no encontrada" });

    // Sync text field in productos
    await pool.query("UPDATE productos SET categoria = ? WHERE categoria_id = ?", [nombre.trim(), id]);

    const [rows] = await pool.query("SELECT * FROM categorias WHERE id = ?", [id]);
    res.json({ success: true, data: rows[0], message: "Categoría actualizada exitosamente" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "Ya existe una categoría con ese nombre" });
    console.error("Error actualizando categoría:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const [[{ total }]] = await pool.query(
      "SELECT COUNT(*) AS total FROM productos WHERE categoria_id = ?", [id]
    );
    if (total > 0) {
      return res.status(400).json({ error: `No se puede eliminar: ${total} producto(s) usan esta categoría` });
    }
    const [result] = await pool.query("DELETE FROM categorias WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Categoría no encontrada" });
    res.json({ success: true, message: "Categoría eliminada exitosamente" });
  } catch (error) {
    console.error("Error eliminando categoría:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};
