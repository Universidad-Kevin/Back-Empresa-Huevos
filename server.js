// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { testConnection } from "./config/database.js";

// Importar rutas
import authRoutes from "./routes/auth.js";
import clientesRoutes from "./routes/clientes.js";
import productosRoutes from "./routes/productos.js";

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS: Permitir orígenes específicos
app.use(
  cors({
    origin: ["http://localhost:5173", "https://huevos-organicos.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging de cada request (útil para desarrollo)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Ruta raíz (info general)
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API de Huevos Orgánicos - Backend funcionando ✅",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      productos: "/api/productos",
      clientes: "/api/clientes",
      health: "/api/health",
      info: "/api/info",
      stats: "/api/stats",
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/productos", productosRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Servidor funcionando correctamente",
    timestamp: new Date().toISOString(),
    database: "Conectado",
  });
});

app.get("/api/info", (req, res) => {
  res.json({
    success: true,
    data: {
      nombre: "API Huevos Orgánicos",
      version: "1.0.0",
      descripcion: "Backend para sistema de gestión de huevos orgánicos",
      autor: "Kevin Tenorio",
    },
  });
});

app.get("/api/stats", async (req, res) => {
  try {
    const pool = await import("./config/database.js").then((mod) => mod.default);

    const [[{ total: totalProductos }]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM productos WHERE estado = "activo"'
    );
    const [[{ total: totalUsuarios }]] = await pool.execute(
      "SELECT COUNT(*) AS total FROM usuarios WHERE activo = TRUE"
    );

    res.json({
      success: true,
      data: {
        totalProductos,
        totalUsuarios,
        servidor: "Online",
      },
    });
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    res.status(500).json({
      success: false,
      message: "Error obteniendo estadísticas",
    });
  }
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
    path: req.originalUrl,
    method: req.method,
  });
});

// Error global
app.use((error, req, res, next) => {
  console.error("Error global:", error);
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
  });
});

const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error("❌ No se pudo conectar a la base de datos. Saliendo...");
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}`);
      console.log(`📦 Entorno: ${process.env.NODE_ENV}`);
      console.log(`🗄️ Base de datos: ${process.env.DB_NAME}`);
      console.log("\n📋 Endpoints principales:");
      console.log("   GET  /api/health     - Estado del servidor");
      console.log("   GET  /api/info       - Información del API");
      console.log("   GET  /api/stats      - Estadísticas básicas");
      console.log("   GET  /api/productos  - Lista de productos");
      console.log("   POST /api/auth/login - Login de usuarios");
    });
  } catch (error) {
    console.error("❌ Error iniciando servidor:", error);
    process.exit(1);
  }
};

startServer();
