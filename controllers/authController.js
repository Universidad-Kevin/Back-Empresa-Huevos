import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pool from "../config/database.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Intento de login para:", req.body);

    // Buscar usuario
    const [users] = await pool.query(
      "SELECT * FROM usuarios WHERE email = ? AND activo = TRUE",
      [email]
    );
    console.log("Usuarios encontrados:", users);
    if (users.length === 0) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const user = users[0];

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    console.log("Validación de contraseña:", validPassword, user.password, password);
    if (!validPassword) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Respuesta al cliente
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
        },
        token,
      },
    });
  } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};
