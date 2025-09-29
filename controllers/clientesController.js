import pool from '../config/database.js';

// Obtener todos los clientes
export const getClientes = async (req, res) => {
  try {
    const [clientes] = await pool.execute(
      'SELECT * FROM clientes ORDER BY creado_en DESC'
    );

    res.json({
      success: true,
      data: clientes,
    });
  } catch (error) {
    console.error("Error obteniendo clientes:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Obtener cliente por ID
export const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;

    const [clientes] = await pool.execute(
      'SELECT * FROM clientes WHERE id = ?',
      [id]
    );

    if (clientes.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json({
      success: true,
      data: clientes[0],
    });
  } catch (error) {
    console.error("Error obteniendo cliente:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Crear nuevo cliente
export const createCliente = async (req, res) => {
  try {
    const {
      nombre_empresa,
      tipo_negocio,
      contacto_nombre,
      email,
      telefono,
      direccion,
      ruc,
      tipo_cliente,
      limite_credito,
      estado
    } = req.body;

    console.log("Datos recibidos para crear cliente:", req.body);

    // Validaciones básicas
    if (!nombre_empresa || !tipo_negocio || !contacto_nombre || !email) {
      return res.status(400).json({
        error: "Nombre de empresa, tipo de negocio, contacto y email son requeridos",
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO clientes 
       (nombre_empresa, tipo_negocio, contacto_nombre, email, telefono, direccion, ruc, tipo_cliente, limite_credito, estado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre_empresa,
        tipo_negocio,
        contacto_nombre,
        email,
        telefono || null,
        direccion || null,
        ruc || null,
        tipo_cliente || 'Mayorista',
        limite_credito || 0,
        estado || 'activo'
      ]
    );

    // Obtener el cliente recién creado
    const [clientes] = await pool.execute(
      "SELECT * FROM clientes WHERE id = ?",
      [result.insertId]
    );

    console.log("Cliente creado con ID:", result.insertId);

    res.status(201).json({
      success: true,
      data: clientes[0],
      message: "Cliente creado exitosamente",
    });
  } catch (error) {
    console.error("Error creando cliente:", error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "El email ya está registrado" });
    }
    
    res.status(500).json({ error: "Error del servidor al crear cliente" });
  }
};

// Actualizar cliente
export const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre_empresa,
      tipo_negocio,
      contacto_nombre,
      email,
      telefono,
      direccion,
      ruc,
      tipo_cliente,
      limite_credito,
      estado
    } = req.body;

    console.log("Actualizando cliente ID:", id, "con datos:", req.body);

    // Validaciones
    if (!nombre_empresa || !tipo_negocio || !contacto_nombre || !email) {
      return res.status(400).json({
        error: "Nombre de empresa, tipo de negocio, contacto y email son requeridos",
      });
    }

    const [result] = await pool.execute(
      `UPDATE clientes 
       SET nombre_empresa = ?, tipo_negocio = ?, contacto_nombre = ?, email = ?, 
           telefono = ?, direccion = ?, ruc = ?, tipo_cliente = ?, limite_credito = ?, estado = ?,
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        nombre_empresa,
        tipo_negocio,
        contacto_nombre,
        email,
        telefono || null,
        direccion || null,
        ruc || null,
        tipo_cliente || 'Mayorista',
        limite_credito || 0,
        estado || 'activo',
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    // Obtener el cliente actualizado
    const [clientes] = await pool.execute(
      "SELECT * FROM clientes WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      data: clientes[0],
      message: "Cliente actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error actualizando cliente:", error);
    res.status(500).json({
      error: "Error del servidor al actualizar cliente",
      details: error.message,
    });
  }
};

// Eliminar cliente (cambiar estado a inactivo)
export const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Desactivando cliente ID:", id);

    const [result] = await pool.execute(
      'UPDATE clientes SET estado = "inactivo", actualizado_en = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    console.log("Filas afectadas:", result.affectedRows);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json({
      success: true,
      message: "Cliente desactivado exitosamente",
    });
  } catch (error) {
    console.error("Error desactivando cliente:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Reactivar cliente
export const reactivarCliente = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Reactivando cliente ID:", id);

    const [result] = await pool.execute(
      'UPDATE clientes SET estado = "activo", actualizado_en = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json({
      success: true,
      message: "Cliente reactivado exitosamente",
    });
  } catch (error) {
    console.error("Error reactivando cliente:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Obtener estadísticas de clientes
export const getClientesStats = async (req, res) => {
  try {
    const [totalClientes] = await pool.execute(
      'SELECT COUNT(*) as total FROM clientes WHERE estado = "activo"'
    );

    const [clientesNuevos] = await pool.execute(
      'SELECT COUNT(*) as nuevos FROM clientes WHERE estado = "activo" AND creado_en >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );

    const [tiposNegocio] = await pool.execute(
      'SELECT tipo_negocio, COUNT(*) as cantidad FROM clientes WHERE estado = "activo" GROUP BY tipo_negocio'
    );

    res.json({
      success: true,
      data: {
        total: totalClientes[0].total,
        nuevos: clientesNuevos[0].nuevos,
        porTipo: tiposNegocio
      }
    });
  } catch (error) {
    console.error("Error obteniendo estadísticas de clientes:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};