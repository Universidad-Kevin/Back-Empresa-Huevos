import bcrypt from "bcryptjs";
import pool from "../config/database.js";

export const getMiPerfil = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, nombre, email, rol, creado_en FROM usuarios WHERE id = ?",
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const getAllUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, nombre, email, rol, creado_en FROM usuarios WHERE rol = 'cliente' ORDER BY creado_en DESC"
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const updateMiPerfil = async (req, res) => {
  try {
    const { nombre, email, password_actual, password_nuevo } = req.body;
    const usuarioId = req.user.id;

    const [rows] = await pool.execute("SELECT * FROM usuarios WHERE id = ?", [usuarioId]);
    if (rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });

    const usuario = rows[0];

    // Si quiere cambiar contraseña, validar la actual
    if (password_nuevo) {
      if (!password_actual) {
        return res.status(400).json({ error: "Debes ingresar tu contraseña actual para cambiarla" });
      }
      const valida = await bcrypt.compare(password_actual, usuario.password);
      if (!valida) {
        return res.status(400).json({ error: "La contraseña actual es incorrecta" });
      }
    }

    // Verificar email único si cambió
    if (email && email !== usuario.email) {
      const [existing] = await pool.execute(
        "SELECT id FROM usuarios WHERE email = ? AND id != ?",
        [email, usuarioId]
      );
      if (existing.length > 0) {
        return res.status(409).json({ error: "El email ya está en uso" });
      }
    }

    const nuevoNombre = nombre || usuario.nombre;
    const nuevoEmail = email || usuario.email;
    let nuevoPassword = usuario.password;

    if (password_nuevo) {
      const salt = await bcrypt.genSalt(10);
      nuevoPassword = await bcrypt.hash(password_nuevo, salt);
    }

    await pool.execute(
      "UPDATE usuarios SET nombre = ?, email = ?, password = ? WHERE id = ?",
      [nuevoNombre, nuevoEmail, nuevoPassword, usuarioId]
    );

    res.json({
      success: true,
      message: "Perfil actualizado correctamente",
      data: { id: usuarioId, nombre: nuevoNombre, email: nuevoEmail, rol: usuario.rol },
    });
  } catch (error) {
    console.error("Error actualizando perfil:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};
