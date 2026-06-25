import pool from "../config/database.js";
import { enviarMensajeContacto } from "../services/emailService.js";

export const getAllInteresados = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM interesados ORDER BY creado_en DESC"
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error getAllInteresados:", error);
    res
      .status(500)
      .json({ success: false, message: "Error obteniendo interesados" });
  }
};

export const getInteresadoById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute("SELECT * FROM interesados WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Interesado no encontrado" });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error getInteresadoById:", error);
    res.status(500).json({ success: false, message: "Error obteniendo interesado" });
  }
};

// Crear Interesado
export const createInteresado = async (req, res) => {
  try {
    const {
      nombre,
      email,
      telefono,
      asunto,
      mensaje,
    } = req.body;

    if (!nombre || !email || !asunto || !mensaje) {
      return res
        .status(400)
        .json({ error: "Nombre, email, asunto y mensaje son requeridos" });
    }

    const [result] = await pool.execute(
      `INSERT INTO interesados
       (nombre, email, telefono, asunto, mensaje, creado_en)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [nombre, email, telefono || null, asunto, mensaje]
    );

    const [nuevoInteresado] = await pool.execute(
      "SELECT * FROM interesados WHERE id = ?",
      [result.insertId]
    );

    // Enviar email al admin (no bloqueante)
    enviarMensajeContacto({ nombre, email, telefono, asunto, mensaje });

    res.status(201).json({
      success: true,
      data: nuevoInteresado[0],
      message: "Mensaje enviado exitosamente",
    });
  } catch (error) {
    console.error("Error creando interesado:", error);
    res.status(500).json({ error: "Error del servidor al crear Interesado" });
  }
};