import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pool from "../config/database.js";
import { enviarBienvenida } from "../services/emailService.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

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

//Creacion de usuario
export const register = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    console.log("Intento de registro:", req.body);

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
