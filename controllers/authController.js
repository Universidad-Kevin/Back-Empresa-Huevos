import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import pool from "../config/database.js";
import { enviarBienvenida, enviarResetPassword } from "../services/emailService.js";
import { registrar } from "../services/auditoriaService.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Formato de email no válido" });
    }

    // 1. Buscar en usuarios
    const [users] = await pool.query(
      "SELECT * FROM usuarios WHERE email = ? AND activo = TRUE",
      [email]
    );

    if (users.length > 0) {
      const user = users[0];
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(401).json({ error: "Credenciales incorrectas" });

      const token = jwt.sign(
        { userId: user.id, email: user.email, rol: user.rol, tabla: "usuarios" },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );
      registrar(req, "login", "usuarios", user.id, { email: user.email, rol: user.rol }, { usuario_id: user.id, rol: user.rol });
      return res.json({
        success: true,
        data: {
          user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
          token,
        },
      });
    }

    // 2. Buscar en clientes (mayoristas)
    const [clientes] = await pool.query(
      "SELECT * FROM clientes WHERE email = ? AND password IS NOT NULL AND estado = 'activo'",
      [email]
    );

    if (clientes.length > 0) {
      const cliente = clientes[0];
      const validPassword = await bcrypt.compare(password, cliente.password);
      if (!validPassword) return res.status(401).json({ error: "Credenciales incorrectas" });

      const token = jwt.sign(
        { userId: cliente.id, email: cliente.email, rol: "mayorista", tabla: "clientes" },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );
      return res.json({
        success: true,
        data: {
          user: {
            id: cliente.id,
            nombre: cliente.contacto_nombre,
            nombre_empresa: cliente.nombre_empresa,
            email: cliente.email,
            rol: "mayorista",
          },
          token,
        },
      });
    }

    return res.status(401).json({ error: "Credenciales incorrectas" });
  } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const register = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre?.trim() || !email || !password) {
      return res.status(400).json({ error: "Nombre, email y contraseña son requeridos" });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Formato de email no válido" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
    }

    // Verificar si el email ya existe
    const [users] = await pool.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [email]
    );

    if (users.length > 0) {
      return res.status(409).json({ error: "Email ya registrado" });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insertar usuario
    const [result] = await pool.query(
      "INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES (?, ?, ?, ?, TRUE)",
      [nombre, email, hashedPassword, "cliente"]
    );

    // Enviar email de bienvenida (no bloqueante)
    enviarBienvenida(nombre, email);

    // Respuesta
    res.json({
      success: true,
      message: "Usuario registrado correctamente",
      data: {
        id: result.insertId,
        nombre,
        email,
        rol: "cliente",
      },
    });
  } catch (error) {
    console.error("❌ Error en registro:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// POST /auth/forgot-password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email requerido" });

  try {
    const [users] = await pool.execute(
      "SELECT id FROM usuarios WHERE email = ? AND activo = TRUE",
      [email]
    );
    const [clientes] = await pool.execute(
      "SELECT id FROM clientes WHERE email = ? AND password IS NOT NULL AND estado = 'activo'",
      [email]
    );

    if (users.length > 0 || clientes.length > 0) {
      const token = crypto.randomBytes(32).toString("hex");
      const expira = new Date(Date.now() + 30 * 60 * 1000); // 30 min

      await pool.execute(
        "INSERT INTO password_resets (email, token, expira_en) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token = VALUES(token), expira_en = VALUES(expira_en), usado = 0",
        [email, token, expira]
      );
      enviarResetPassword(email, token);
    }
    res.json({ success: true, message: "Si el email está registrado, recibirás un enlace en breve." });
  } catch (e) {
    console.error("forgotPassword:", e);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// POST /auth/reset-password
export const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: "Token y contraseña requeridos" });
  if (password.length < 8) return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });

  try {
    const [rows] = await pool.execute(
      "SELECT * FROM password_resets WHERE token = ? AND usado = 0 AND expira_en > NOW()",
      [token]
    );
    if (rows.length === 0) return res.status(400).json({ error: "Token inválido o expirado" });

    const { email } = rows[0];
    const hash = await bcrypt.hash(password, 10);

    await pool.execute("UPDATE usuarios SET password = ? WHERE email = ?", [hash, email]);
    await pool.execute("UPDATE clientes SET password = ? WHERE email = ?", [hash, email]);
    await pool.execute("UPDATE password_resets SET usado = 1 WHERE token = ?", [token]);

    res.json({ success: true, message: "Contraseña actualizada correctamente" });
  } catch (e) {
    console.error("resetPassword:", e);
    res.status(500).json({ error: "Error del servidor" });
  }
};
