import pool from "../config/database.js";
import bcrypt from "bcryptjs";
import { enviarBienvenidaMayorista } from "../services/emailService.js";

const CLIENTE_FIELDS = "id, nombre_empresa, tipo_negocio, contacto_nombre, email, telefono, direccion, ruc, tipo_cliente, limite_credito, estado, creado_en, actualizado_en";

// // Obtener todos los clientes
// export const getClientes = async (req, res) => {
//   try {
//     const [rows] = await pool.query(
//       "SELECT * FROM clientes ORDER BY creado_en DESC"
//     );
//     res.json({ success: true, data: rows });
//   } catch (error) {
//     console.error("Error obteniendo clientes:", error);
//     res.status(500).json({ error: "Error del servidor" });
//   }
// };

export const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`SELECT ${CLIENTE_FIELDS} FROM clientes WHERE id = ?`, [
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
      password,
    } = req.body;

    if (!nombre_empresa || !tipo_negocio || !contacto_nombre || !email) {
      return res.status(400).json({
        error:
          "Nombre de empresa, tipo de negocio, contacto y email son requeridos",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Formato de email inválido" });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO clientes
       (nombre_empresa, tipo_negocio, contacto_nombre, email, telefono, direccion, ruc, tipo_cliente, limite_credito, estado, password, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
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
        hashedPassword,
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
      `SELECT ${CLIENTE_FIELDS} FROM clientes WHERE id = ?`,
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

// Obtener todos los clientes
export const getAllClientes= async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ${CLIENTE_FIELDS} FROM clientes ORDER BY creado_en DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error obteniendo todos los clientes:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Obtener todos los productos activos
export const getClientesActivos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ${CLIENTE_FIELDS} FROM clientes WHERE estado = 'activo' ORDER BY creado_en DESC`
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error obteniendo clientes activos:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Obtener clientes inactivos
export const getClientesInactivos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ${CLIENTE_FIELDS} FROM clientes WHERE estado = 'inactivo' ORDER BY creado_en DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error obteniendo clientes inactivos:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const asignarCredenciales = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, enviarEmail } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    const [rows] = await pool.query("SELECT id, contacto_nombre, nombre_empresa, email FROM clientes WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Cliente no encontrado" });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    await pool.query("UPDATE clientes SET password = ? WHERE id = ?", [hashed, id]);

    if (enviarEmail !== false) {
      enviarBienvenidaMayorista(rows[0].contacto_nombre, rows[0].nombre_empresa, rows[0].email, password)
        .catch((err) => console.error("Error enviando email de bienvenida:", err));
    }

    res.json({ success: true, message: "Credenciales asignadas correctamente" });
  } catch (error) {
    console.error("Error asignando credenciales:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// SDI-66: Cambiar estado de cliente (activo/inactivo/pendiente)
export const patchEstadoCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!["activo", "inactivo", "pendiente"].includes(estado)) {
      return res.status(400).json({ error: "Estado inválido. Use: activo, inactivo, pendiente" });
    }

    const [result] = await pool.query(
      "UPDATE clientes SET estado = ?, actualizado_en = NOW() WHERE id = ?",
      [estado, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    const [rows] = await pool.query(`SELECT ${CLIENTE_FIELDS} FROM clientes WHERE id = ?`, [id]);
    const labels = { activo: "activado", inactivo: "desactivado", pendiente: "marcado como pendiente" };
    res.json({ success: true, data: rows[0], message: `Cliente ${labels[estado]} exitosamente` });
  } catch (error) {
    console.error("Error cambiando estado de cliente:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Obtener clientes pendientes
export const getClientesPendientes = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ${CLIENTE_FIELDS} FROM clientes WHERE estado = 'pendiente' ORDER BY creado_en DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error obteniendo clientes pendientes:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// export const getClientesStats = async (req, res) => {
//   try {
//     const [result] = await pool.query(`
//  SELECT 
//         COUNT(*) AS totalClientes,
//         COUNT(CASE WHEN estado = 'activo' THEN 1 END) AS clientesActivos,
//         COUNT(CASE WHEN estado = 'inactivo' THEN 1 END) AS clientesInactivos
//       FROM clientes
//     `);

//     res.json({
//       success: true,
//       data: result[0],
//     });
//   } catch (error) {
//     console.error("Error obteniendo estadísticas de clientes:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error obteniendo estadísticas de clientes",
//     });
//   }
// };
