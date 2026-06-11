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
      "SELECT * FROM productos WHERE id = ?",
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
      nombre, descripcion, precio, categoria, imagen, stock,
      estado, caracteristicas, codigo, unidad, categoria_id, marca_id,
    } = req.body;
    console.log("Datos recibidos para crear producto:", req.body);

    let categoriaText = categoria || null;
    let catId = categoria_id || null;
    if (catId) {
      const [cats] = await pool.query("SELECT nombre FROM categorias WHERE id = ?", [catId]);
      if (cats.length > 0) categoriaText = cats[0].nombre;
    }

    if (!nombre || !precio || (!categoriaText && !catId)) {
      return res.status(400).json({ error: "Nombre, precio y categoría son requeridos" });
    }

    const [result] = await pool.query(
      `INSERT INTO productos
       (codigo, nombre, descripcion, precio, categoria, categoria_id, marca_id, imagen, stock, unidad, estado, caracteristicas, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        codigo || null,
        nombre,
        descripcion || null,
        precio,
        categoriaText,
        catId,
        marca_id || null,
        imagen || null,
        stock !== undefined ? stock : 0,
        unidad || 'unidad',
        estado || 'activo',
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
      nombre, descripcion, precio, categoria, imagen, stock,
      estado, caracteristicas, codigo, unidad, categoria_id, marca_id,
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

    const [existing] = await pool.query("SELECT * FROM productos WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    const currentProduct = existing[0];

    const updateEstado = estado !== undefined ? estado : currentProduct.estado;
    const updateStock = stock !== undefined ? stock : currentProduct.stock;
    const updateImagen = imagen !== undefined ? imagen : currentProduct.imagen;
    const updateDescripcion = descripcion !== undefined ? descripcion : currentProduct.descripcion;
    const updateCodigo = codigo !== undefined ? codigo || null : currentProduct.codigo;
    const updateUnidad = unidad || currentProduct.unidad || 'unidad';
    let updateCaracteristicas = currentProduct.caracteristicas;
    if (caracteristicas !== undefined) {
      updateCaracteristicas = typeof caracteristicas === 'string' ? caracteristicas : JSON.stringify(caracteristicas);
    }

    let updateCategoriaText = categoria !== undefined ? categoria : currentProduct.categoria;
    let updateCategoriaId = categoria_id !== undefined ? (categoria_id || null) : currentProduct.categoria_id;
    let updateMarcaId = marca_id !== undefined ? (marca_id || null) : currentProduct.marca_id;
    if (updateCategoriaId) {
      const [cats] = await pool.query("SELECT nombre FROM categorias WHERE id = ?", [updateCategoriaId]);
      if (cats.length > 0) updateCategoriaText = cats[0].nombre;
    }

    const [result] = await pool.query(
      `UPDATE productos
       SET codigo = ?, nombre = ?, descripcion = ?, precio = ?, categoria = ?,
           categoria_id = ?, marca_id = ?, imagen = ?, stock = ?, unidad = ?,
           estado = ?, caracteristicas = ?, actualizado_en = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        updateCodigo,
        nombre,
        updateDescripcion,
        precio,
        updateCategoriaText,
        updateCategoriaId,
        updateMarcaId,
        updateImagen,
        updateStock,
        updateUnidad,
        updateEstado,
        updateCaracteristicas,
        id,
      ]
    );

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

// Eliminar producto (soft delete — inactiva para no romper FK con detalle_pedidos)
export const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      "UPDATE productos SET estado = 'inactivo', actualizado_en = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ success: true, message: "Producto desactivado exitosamente" });
  } catch (error) {
    console.error("Error desactivando producto:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// SDI-64: Cambiar estado de producto (activo/inactivo)
export const patchEstadoProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!["activo", "inactivo"].includes(estado)) {
      return res.status(400).json({ error: "Estado inválido. Use: activo, inactivo" });
    }

    const [result] = await pool.query(
      "UPDATE productos SET estado = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?",
      [estado, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const [rows] = await pool.query("SELECT * FROM productos WHERE id = ?", [id]);
    res.json({
      success: true,
      data: rows[0],
      message: `Producto ${estado === "activo" ? "activado" : "desactivado"} exitosamente`,
    });
  } catch (error) {
    console.error("Error cambiando estado de producto:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};


// POST /productos/:id/imagen — sube imagen y la guarda como base64 en la BD
export const uploadImagenProducto = async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo" });

  try {
    const [rows] = await pool.execute("SELECT id FROM productos WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Producto no encontrado" });

    const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    await pool.execute(
      "UPDATE productos SET imagen = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?",
      [dataUrl, id]
    );

    res.json({ success: true, imagen: dataUrl });
  } catch (e) {
    console.error("uploadImagenProducto:", e);
    res.status(500).json({ error: "Error del servidor" });
  }
};
