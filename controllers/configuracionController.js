import pool from "../config/database.js";

export const getConfiguracion = async (req, res) => {
  try {
    const [[config]] = await pool.execute(
      "SELECT nombre_empresa, email_contacto, telefono, direccion, descripcion FROM configuracion WHERE id = 1"
    );
    if (!config) return res.status(404).json({ error: "Configuración no inicializada" });
    res.json({ success: true, data: config });
  } catch (error) {
    console.error("Error obteniendo configuración:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const updateConfiguracion = async (req, res) => {
  try {
    const { nombre_empresa, email_contacto, telefono, direccion, descripcion } = req.body;

    if (!nombre_empresa?.trim() || !email_contacto?.trim()) {
      return res.status(400).json({ error: "Nombre de la empresa y email de contacto son requeridos" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_contacto)) {
      return res.status(400).json({ error: "Formato de email inválido" });
    }
    if (nombre_empresa.length > 150) {
      return res.status(400).json({ error: "El nombre de la empresa no puede superar los 150 caracteres" });
    }
    if (descripcion && descripcion.length > 2000) {
      return res.status(400).json({ error: "La descripción no puede superar los 2000 caracteres" });
    }

    await pool.execute(
      `UPDATE configuracion
       SET nombre_empresa = ?, email_contacto = ?, telefono = ?, direccion = ?, descripcion = ?
       WHERE id = 1`,
      [nombre_empresa.trim(), email_contacto.trim(), telefono || null, direccion || null, descripcion || null]
    );

    const [[config]] = await pool.execute(
      "SELECT nombre_empresa, email_contacto, telefono, direccion, descripcion FROM configuracion WHERE id = 1"
    );

    res.json({ success: true, data: config, message: "Configuración actualizada exitosamente" });
  } catch (error) {
    console.error("Error actualizando configuración:", error);
    res.status(500).json({ error: "Error del servidor al actualizar configuración" });
  }
};
