import pool from "../config/database.js";

export const getProveedores = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*,
        COUNT(m.id) AS total_entradas,
        MAX(m.creado_en) AS ultima_entrada
       FROM proveedores p
       LEFT JOIN movimientos_inventario m ON m.proveedor_id = p.id AND m.tipo = 'entrada'
       GROUP BY p.id
       ORDER BY p.nombre ASC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("getProveedores:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const getProveedorById = async (req, res) => {
  try {
    const { id } = req.params;
    const [[proveedor]] = await pool.query("SELECT * FROM proveedores WHERE id = ?", [id]);
    if (!proveedor) return res.status(404).json({ error: "Proveedor no encontrado" });

    const [entradas] = await pool.query(
      `SELECT m.*, p.nombre AS producto_nombre, p.unidad
       FROM movimientos_inventario m
       LEFT JOIN productos p ON m.producto_id = p.id
       WHERE m.proveedor_id = ? AND m.tipo = 'entrada'
       ORDER BY m.creado_en DESC
       LIMIT 20`,
      [id]
    );

    res.json({ success: true, data: { ...proveedor, entradas } });
  } catch (error) {
    console.error("getProveedorById:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const createProveedor = async (req, res) => {
  try {
    const { nombre, contacto_nombre, email, telefono, direccion, ruc, notas } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: "El nombre del proveedor es requerido" });

    const [result] = await pool.query(
      `INSERT INTO proveedores (nombre, contacto_nombre, email, telefono, direccion, ruc, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre.trim(), contacto_nombre || null, email || null, telefono || null, direccion || null, ruc || null, notas || null]
    );
    const [[nuevo]] = await pool.query("SELECT * FROM proveedores WHERE id = ?", [result.insertId]);
    res.status(201).json({ success: true, data: nuevo, message: "Proveedor creado exitosamente" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "Ya existe un proveedor con ese dato" });
    console.error("createProveedor:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const updateProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, contacto_nombre, email, telefono, direccion, ruc, notas } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: "El nombre del proveedor es requerido" });

    const [result] = await pool.query(
      `UPDATE proveedores
       SET nombre=?, contacto_nombre=?, email=?, telefono=?, direccion=?, ruc=?, notas=?,
           actualizado_en=CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nombre.trim(), contacto_nombre || null, email || null, telefono || null, direccion || null, ruc || null, notas || null, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Proveedor no encontrado" });

    const [[actualizado]] = await pool.query("SELECT * FROM proveedores WHERE id = ?", [id]);
    res.json({ success: true, data: actualizado, message: "Proveedor actualizado exitosamente" });
  } catch (error) {
    console.error("updateProveedor:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const patchEstadoProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    if (!["activo", "inactivo"].includes(estado)) {
      return res.status(400).json({ error: "Estado inválido. Use: activo, inactivo" });
    }
    const [result] = await pool.query(
      "UPDATE proveedores SET estado = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?",
      [estado, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Proveedor no encontrado" });
    res.json({ success: true, message: `Proveedor ${estado === "activo" ? "activado" : "desactivado"} exitosamente` });
  } catch (error) {
    console.error("patchEstadoProveedor:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const deleteProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const [[{ total }]] = await pool.query(
      "SELECT COUNT(*) AS total FROM movimientos_inventario WHERE proveedor_id = ?", [id]
    );
    if (total > 0) {
      return res.status(400).json({ error: `No se puede eliminar: tiene ${total} entrada(s) de inventario asociadas` });
    }
    const [result] = await pool.query("DELETE FROM proveedores WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Proveedor no encontrado" });
    res.json({ success: true, message: "Proveedor eliminado exitosamente" });
  } catch (error) {
    console.error("deleteProveedor:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};
