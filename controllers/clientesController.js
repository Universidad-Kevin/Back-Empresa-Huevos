import pool from "../config/database.js";

// Obtener todos los clientes
export const getClientes = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM clientes ORDER BY creado_en DESC"
    );

    res.json({
      success: true,
      data: result.rows,
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

    const result = await pool.query("SELECT * FROM clientes WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json({
      success: true,
      data: result.rows[0],
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
      estado,
    } = req.body;

    if (!nombre_empresa || !tipo_negocio || !contacto_nombre || !email) {
      return res.status(400).json({
        error:
          "Nombre de empresa, tipo de negocio, contacto y email son requeridos",
      });
    }

    const insertResult = await pool.query(
      `INSERT INTO clientes 
       (nombre_empresa, tipo_negocio, contacto_nombre, email, telefono, direccion, ruc, tipo_cliente, limite_credito, estado, creado_en)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NOW())
       RETURNING *`,
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

    res.status(201).json({
      success: true,
      data: insertResult.rows[0],
      message: "Cliente creado exitosamente",
    });
  } catch (error) {
    console.error("Error creando cliente:", error);

    if (error.code === "23505") {
      // Código de error para UNIQUE constraint en PostgreSQL
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
      estado,
    } = req.body;

    if (!nombre_empresa || !tipo_negocio || !contacto_nombre || !email) {
      return res.status(400).json({
        error:
          "Nombre de empresa, tipo de negocio, contacto y email son requeridos",
      });
    }

    const result = await pool.query(
      `UPDATE clientes
       SET nombre_empresa = $1, tipo_negocio = $2, contacto_nombre = $3, email = $4,
           telefono = $5, direccion = $6, ruc = $7, tipo_cliente = $8,
           limite_credito = $9, estado = $10, actualizado_en = NOW()
       WHERE id = $11
       RETURNING *`,
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

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: "Cliente actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error actualizando cliente:", error);
    res.status(500).json({
      error: "Error del servidor al actualizar cliente",
    });
  }
};

// Eliminar cliente (estado = inactivo)
export const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE clientes 
       SET estado = 'inactivo', actualizado_en = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
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

    const result = await pool.query(
      `UPDATE clientes 
       SET estado = 'activo', actualizado_en = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
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
    const totalClientes = await pool.query(
      "SELECT COUNT(*) AS total FROM clientes WHERE estado = 'activo'"
    );

    const clientesNuevos = await pool.query(
      "SELECT COUNT(*) AS nuevos FROM clientes WHERE estado = 'activo' AND creado_en >= NOW() - INTERVAL '30 days'"
    );

    const tiposNegocio = await pool.query(
      "SELECT tipo_negocio, COUNT(*) AS cantidad FROM clientes WHERE estado = 'activo' GROUP BY tipo_negocio"
    );

    res.json({
      success: true,
      data: {
        total: parseInt(totalClientes.rows[0].total),
        nuevos: parseInt(clientesNuevos.rows[0].nuevos),
        porTipo: tiposNegocio.rows,
      },
    });
  } catch (error) {
    console.error("Error obteniendo estadísticas de clientes:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};
