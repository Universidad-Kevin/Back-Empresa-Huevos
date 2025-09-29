import pool from "../config/database.js";

// Obtener todos los productos activos
export const getProductos = async (req, res) => {
  try {
    const [productos] = await pool.execute(
      'SELECT * FROM productos WHERE estado = "activo" ORDER BY creado_en DESC'
    );

    res.json({
      success: true,
      data: productos,
    });
  } catch (error) {
    console.error("Error obteniendo productos:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Reactivar producto (solo cambia estado a activo)
export const reactivarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Reactivando producto ID:", id);

    const [result] = await pool.execute(
      'UPDATE productos SET estado = "activo", creado_en = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    console.log("Producto reactivado. Filas afectadas:", result.affectedRows);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // Obtener el producto reactivado
    const [productos] = await pool.execute(
      "SELECT * FROM productos WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      data: productos[0],
      message: "Producto reactivado exitosamente",
    });
  } catch (error) {
    console.error("Error reactivando producto:", error);
    res.status(500).json({
      error: "Error del servidor al reactivar producto",
      details: error.message,
    });
  }
};

// Obtener todos los productos (activos e inactivos)
export const getAllProductos = async (req, res) => {
  try {
    const [productos] = await pool.execute(
      "SELECT * FROM productos ORDER BY creado_en DESC"
    );

    res.json({
      success: true,
      data: productos,
    });
  } catch (error) {
    console.error("Error obteniendo todos los productos:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Obtener solo productos inactivos
export const getProductosInactivos = async (req, res) => {
  try {
    const [productos] = await pool.execute(
      'SELECT * FROM productos WHERE estado = "inactivo" ORDER BY creado_en DESC'
    );

    res.json({
      success: true,
      data: productos,
    });
  } catch (error) {
    console.error("Error obteniendo productos inactivos:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Obtener producto por ID
export const getProductoById = async (req, res) => {
  try {
    const { id } = req.params;

    const [productos] = await pool.execute(
      'SELECT * FROM productos WHERE id = ? AND estado = "activo"',
      [id]
    );

    if (productos.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({
      success: true,
      data: productos[0],
    });
  } catch (error) {
    console.error("Error obteniendo producto:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// ✅ NUEVO: Crear producto
export const createProducto = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      precio,
      categoria,
      imagen,
      stock,
      caracteristicas,
    } = req.body;

    console.log("Datos recibidos para crear producto:", req.body);

    // Validaciones básicas
    if (!nombre || !precio || !categoria) {
      return res.status(400).json({
        error: "Nombre, precio y categoría son requeridos",
      });
    }

    const [result] = await pool.execute(
      "INSERT INTO productos (nombre, descripcion, precio, categoria, imagen, stock, caracteristicas) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        nombre,
        descripcion,
        precio,
        categoria,
        imagen || null,
        stock || 0,
        JSON.stringify(caracteristicas || []),
      ]
    );

    // Obtener el producto recién creado
    const [productos] = await pool.execute(
      "SELECT * FROM productos WHERE id = ?",
      [result.insertId]
    );

    console.log("Producto creado con ID:", result.insertId);

    res.status(201).json({
      success: true,
      data: productos[0],
      message: "Producto creado exitosamente",
    });
  } catch (error) {
    console.error("Error creando producto:", error);
    res.status(500).json({ error: "Error del servidor al crear producto" });
  }
};

// ✅ CORREGIDO: Actualizar producto
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

    // Si solo estamos cambiando el estado, obtener los datos actuales primero
    if (Object.keys(req.body).length === 1 && req.body.estado) {
      // Solo estamos cambiando el estado, obtener datos actuales
      const [productosActuales] = await pool.execute(
        "SELECT * FROM productos WHERE id = ?",
        [id]
      );

      if (productosActuales.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const productoActual = productosActuales[0];

      const [result] = await pool.execute(
        `UPDATE productos 
         SET estado = ?, actualizado_en = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [estado, id]
      );

      console.log(
        "Solo estado actualizado. Filas afectadas:",
        result.affectedRows
      );
    } else {
      // Actualización completa del producto
      // Validaciones para actualización completa
      if (!nombre || !precio || !categoria) {
        return res.status(400).json({
          error:
            "Nombre, precio y categoría son requeridos para actualización completa",
        });
      }

      const [result] = await pool.execute(
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

      console.log(
        "Producto completamente actualizado. Filas afectadas:",
        result.affectedRows
      );
    }

    // Obtener el producto actualizado
    const [productos] = await pool.execute(
      "SELECT * FROM productos WHERE id = ?",
      [id]
    );

    if (productos.length === 0) {
      return res
        .status(404)
        .json({ error: "Producto no encontrado después de actualizar" });
    }

    res.json({
      success: true,
      data: productos[0],
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

// ✅ NUEVO: Eliminar producto
export const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Eliminando producto ID:", id);

    const [result] = await pool.execute(
      'UPDATE productos SET estado = "inactivo" WHERE id = ?',
      [id]
    );

    console.log("Filas afectadas:", result.affectedRows);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({
      success: true,
      message: "Producto eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error eliminando producto:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};
