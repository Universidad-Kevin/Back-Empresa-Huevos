import pool from "../config/database.js";

// Obtener todos los productos activos
export const getProductos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM productos WHERE estado = 'activo' ORDER BY creado_en DESC"
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error obteniendo productos:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Reactivar producto
export const reactivarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Reactivando producto ID:", id);

    const [result] = await pool.query(
      "UPDATE productos SET estado = 'activo', actualizado_en = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const [rows] = await pool.query("SELECT * FROM productos WHERE id = ?", [
      id,
    ]);

    res.json({
      success: true,
      data: rows[0],
      message: "Producto reactivado exitosamente",
    });
  } catch (error) {
    console.error("Error reactivando producto:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Obtener todos los productos (activos e inactivos)
export const getAllProductos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM productos ORDER BY creado_en DESC"
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error obteniendo todos los productos:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Obtener productos inactivos
export const getProductosInactivos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM productos WHERE estado = 'inactivo' ORDER BY creado_en DESC"
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error obteniendo productos inactivos:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Obtener producto por ID
export const getProductoById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM productos WHERE id = ? AND estado = 'activo'",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error obteniendo producto:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Crear producto
export const createProducto = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      precio,
      categoria,
      imagen,
      stock,
      estado,
      caracteristicas,
    } = req.body;
    console.log("Datos recibidos para crear producto:", req.body);

    if (!nombre || !precio || !categoria) {
      return res
        .status(400)
        .json({ error: "Nombre, precio y categoría son requeridos" });
    }

    const [result] = await pool.query(
      `INSERT INTO productos 
       (nombre, descripcion, precio, categoria, imagen, stock, estado, caracteristicas, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        nombre,
        descripcion || null,
        precio,
        categoria,
        imagen || null,
        stock || 0,
        estado,
        JSON.stringify(caracteristicas || []),
      ]
    );

    const [nuevoProducto] = await pool.query(
      "SELECT * FROM productos WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: nuevoProducto[0],
      message: "Producto creado exitosamente",
    });
  } catch (error) {
    console.error("Error creando producto:", error);
    res.status(500).json({ error: "Error del servidor al crear producto" });
  }
};

// Actualizar producto
export const updateProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      precio,
      categoria,
      imagen,
      stock,
      estado,
      caracteristicas,
    } = req.body;

    console.log("Actualizando producto ID:", id, "con datos:", req.body);

    // Si solo se cambia el estado
    if (Object.keys(req.body).length === 1 && req.body.estado) {
      const [result] = await pool.query(
        `UPDATE productos 
         SET estado = ?, actualizado_en = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [estado, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const [rows] = await pool.query("SELECT * FROM productos WHERE id = ?", [
        id,
      ]);
      return res.json({
        success: true,
        data: rows[0],
        message: "Estado actualizado exitosamente",
      });
    }

    if (!nombre || !precio || !categoria) {
      return res.status(400).json({
        error:
          "Nombre, precio y categoría son requeridos para actualización completa",
      });
    }

    const [result] = await pool.query(
      `UPDATE productos 
       SET nombre = ?, descripcion = ?, precio = ?, categoria = ?, 
           imagen = ?, stock = ?, estado = ?, caracteristicas = ?, actualizado_en = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        nombre,
        descripcion,
        precio,
        categoria,
        imagen,
        stock,
        estado,
        JSON.stringify(caracteristicas || []),
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const [productoActualizado] = await pool.query(
      "SELECT * FROM productos WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      data: productoActualizado[0],
      message: "Producto actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error actualizando producto:", error);
    res.status(500).json({
      error: "Error del servidor al actualizar producto",
      details: error.message,
    });
  }
};

// Eliminar producto (inactivar)
export const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Eliminando producto ID:", id);

    const [result] = await pool.query(
      "UPDATE productos SET estado = 'inactivo', actualizado_en = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ success: true, message: "Producto eliminado exitosamente" });
  } catch (error) {
    console.error("Error eliminando producto:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};
