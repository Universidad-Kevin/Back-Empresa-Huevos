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
      "SELECT id, nombre, email, rol, estado, creado_en FROM usuarios WHERE rol = 'cliente' ORDER BY creado_en DESC"
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// SDI-65: Soft delete — desactiva el usuario sin borrar su historial
export const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute("SELECT id, rol FROM usuarios WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    if (rows[0].rol === "admin") return res.status(403).json({ error: "No se puede desactivar un administrador" });

    await pool.execute(
      "UPDATE usuarios SET estado = 'inactivo', actualizado_en = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    res.json({ success: true, message: "Usuario desactivado correctamente" });
  } catch (error) {
    console.error("Error desactivando usuario:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// SDI-65: Cambiar estado de usuario (activo/inactivo)
export const patchEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!["activo", "inactivo"].includes(estado)) {
      return res.status(400).json({ error: "Estado inválido. Use: activo, inactivo" });
    }

    const [rows] = await pool.execute("SELECT id, rol FROM usuarios WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    if (rows[0].rol === "admin") return res.status(403).json({ error: "No se puede modificar el estado de un administrador" });

    await pool.execute(
      "UPDATE usuarios SET estado = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?",
      [estado, id]
    );

    res.json({
      success: true,
      message: `Usuario ${estado === "activo" ? "activado" : "desactivado"} correctamente`,
    });
  } catch (error) {
    console.error("Error cambiando estado de usuario:", error);
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

    // Validaciones de longitud (H-14: solo en frontend antes, ahora también en backend)
    if (nombre && nombre.trim().length > 50) {
      return res.status(400).json({ error: "El nombre no puede superar 50 caracteres" });
    }

    // Si quiere cambiar contraseña, validar la actual
    if (password_nuevo) {
      if (!password_actual) {
        return res.status(400).json({ error: "Debes ingresar tu contraseña actual para cambiarla" });
      }
      if (password_nuevo.length < 8) {
        return res.status(400).json({ error: "La nueva contraseña debe tener al menos 8 caracteres" });
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

    const nuevoNombre = nombre?.trim() || usuario.nombre;
    const nuevoEmail = email || usuario.email;
    let nuevoPassword = usuario.password;
    let passwordCambio = false;

    if (password_nuevo) {
      const salt = await bcrypt.genSalt(10);
      nuevoPassword = await bcrypt.hash(password_nuevo, salt);
      passwordCambio = true;
    }

    if (passwordCambio) {
      await pool.execute(
        "UPDATE usuarios SET nombre = ?, email = ?, password = ?, password_changed_at = NOW() WHERE id = ?",
        [nuevoNombre, nuevoEmail, nuevoPassword, usuarioId]
      );
    } else {
      await pool.execute(
        "UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?",
        [nuevoNombre, nuevoEmail, usuarioId]
      );
    }

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
