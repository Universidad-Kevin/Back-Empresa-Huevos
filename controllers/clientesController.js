import pool from "../config/database.js";

export const getClientes = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM clientes ORDER BY creado_en DESC"
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error obteniendo clientes:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM clientes WHERE id = ?", [
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error obteniendo cliente:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

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
      estado,
    } = req.body;

    if (!nombre_empresa || !tipo_negocio || !contacto_nombre || !email) {
      return res.status(400).json({
        error:
          "Nombre de empresa, tipo de negocio, contacto y email son requeridos",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO clientes 
       (nombre_empresa, tipo_negocio, contacto_nombre, email, telefono, direccion, ruc, tipo_cliente, limite_credito, estado, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        nombre_empresa,
        tipo_negocio,
        contacto_nombre,
        email,
        telefono || null,
        direccion || null,
        ruc || null,
        tipo_cliente || "Mayorista",
        limite_credito || 0,
        estado || "activo",
      ]
    );

    const [nuevoCliente] = await pool.query(
      "SELECT * FROM clientes WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: nuevoCliente[0],
      message: "Cliente creado exitosamente",
    });
  } catch (error) {
    console.error("Error creando cliente:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "El email ya está registrado" });
    }
    res.status(500).json({ error: "Error del servidor al crear cliente" });
  }
};

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
      estado,
    } = req.body;

    const [result] = await pool.query(
      `UPDATE clientes
       SET nombre_empresa = ?, tipo_negocio = ?, contacto_nombre = ?, email = ?,
           telefono = ?, direccion = ?, ruc = ?, tipo_cliente = ?,
           limite_credito = ?, estado = ?, actualizado_en = NOW()
       WHERE id = ?`,
      [
        nombre_empresa,
        tipo_negocio,
        contacto_nombre,
        email,
        telefono || null,
        direccion || null,
        ruc || null,
        tipo_cliente || "Mayorista",
        limite_credito || 0,
        estado || "activo",
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    const [clienteActualizado] = await pool.query(
      "SELECT * FROM clientes WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      data: clienteActualizado[0],
      message: "Cliente actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error actualizando cliente:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      `UPDATE clientes 
       SET estado = 'inactivo', actualizado_en = NOW()
       WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json({ success: true, message: "Cliente desactivado exitosamente" });
  } catch (error) {
    console.error("Error desactivando cliente:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const reactivarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      `UPDATE clientes 
       SET estado = 'activo', actualizado_en = NOW()
       WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json({ success: true, message: "Cliente reactivado exitosamente" });
  } catch (error) {
    console.error("Error reactivando cliente:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const getClientesStats = async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT 
        COUNT(*) AS totalClientes,
        COUNT(CASE WHEN estado = 'activo' THEN 1 END) AS clientesActivos,
        COUNT(CASE WHEN estado = 'inactivo' THEN 1 END) AS clientesInactivos
      FROM clientes
    `);

    res.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("Error obteniendo estadísticas de clientes:", error);
    res.status(500).json({
      success: false,
      message: "Error obteniendo estadísticas de clientes",
    });
  }
};
