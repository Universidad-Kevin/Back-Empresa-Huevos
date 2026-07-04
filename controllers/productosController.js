import pool from "../config/database.js";
import { uploadBuffer } from "../config/cloudinary.js";

// Obtener productos activos con paginación, búsqueda y filtro por categoría (SDI-264, SDI-278)
export const getProductos = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const q          = req.query.q?.trim()          || null;
    const categoriaId = req.query.categoria_id       || null;
    const marcaId     = req.query.marca_id           || null;

    const conditions = ["p.estado = 'activo'"];
    const params = [];

    if (categoriaId) { conditions.push("p.categoria_id = ?"); params.push(categoriaId); }
    if (marcaId)     { conditions.push("p.marca_id = ?");     params.push(marcaId); }
    if (q) {
      conditions.push("(p.nombre LIKE ? OR p.descripcion LIKE ?)");
      params.push(`%${q}%`, `%${q}%`);
    }

    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM productos p ${where}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT p.*, cat.nombre AS categoria_nombre, m.nombre AS marca_nombre
       FROM productos p
       LEFT JOIN categorias cat ON cat.id = p.categoria_id
       LEFT JOIN marcas m ON m.id = p.marca_id
       ${where}
       ORDER BY p.creado_en DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error obteniendo productos:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Reactivar producto
export const reactivarProducto = async (req, res) => {
  try {
    const { id } = req.params;

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

    let categoriaText = categoria || null;
    let catId = categoria_id || null;
    if (catId) {
      const [cats] = await pool.query("SELECT nombre FROM categorias WHERE id = ?", [catId]);
      if (cats.length > 0) categoriaText = cats[0].nombre;
    }

    if (!nombre || !precio || (!categoriaText && !catId)) {
      return res.status(400).json({ error: "Nombre, precio y categoría son requeridos" });
    }

    if (parseFloat(precio) <= 0) {
      return res.status(400).json({ error: "El precio debe ser mayor a 0" });
    }

    if (nombre.length > 200) {
      return res.status(400).json({ error: "El nombre no puede superar los 200 caracteres" });
    }

    if (descripcion && descripcion.length > 2000) {
      return res.status(400).json({ error: "La descripción no puede superar los 2000 caracteres" });
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

    if (parseFloat(precio) <= 0) {
      return res.status(400).json({ error: "El precio debe ser mayor a 0" });
    }

    if (nombre.length > 200) {
      return res.status(400).json({ error: "El nombre no puede superar los 200 caracteres" });
    }

    if (descripcion && descripcion.length > 2000) {
      return res.status(400).json({ error: "La descripción no puede superar los 2000 caracteres" });
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
    res.status(500).json({ error: "Error del servidor al actualizar producto" });
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


// POST /productos/:id/imagen — sube imagen a Cloudinary y guarda la URL en la BD
export const uploadImagenProducto = async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo" });

  try {
    const [rows] = await pool.execute("SELECT id FROM productos WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Producto no encontrado" });

    const result = await uploadBuffer(req.file.buffer, {
      public_id: `producto-${id}`,
      overwrite: true,
    });

    await pool.execute(
      "UPDATE productos SET imagen = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?",
      [result.secure_url, id]
    );

    res.json({ success: true, imagen: result.secure_url });
  } catch (e) {
    console.error("uploadImagenProducto:", e);
    res.status(500).json({ error: "Error al subir imagen" });
  }
};
