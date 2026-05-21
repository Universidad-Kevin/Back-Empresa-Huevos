// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { testConnection } from "./config/database.js";

// Rutas
import authRoutes from "./routes/auth.js";
import clientesRoutes from "./routes/clientes.js";
import productosRoutes from "./routes/productos.js";
import interesadosRoutes from "./routes/interesados.js";
import pedidosRoutes from "./routes/pedidos.js";
import usuariosRoutes from "./routes/usuarios.js";
import carritoRoutes from "./routes/carrito.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ⚡ Middleware CORS - Desarrollo local
if (process.env.NODE_ENV !== "production") {
  app.use(cors({ origin: "*", credentials: true }));
} else {
  const allowedOrigins = [process.env.FRONTEND_URL];
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`⚠️  Bloqueado por CORS: ${origin}`);
          callback(new Error("CORS bloqueado: origen no permitido"));
        }
      },
      credentials: true,
    })
  );
}

// Middleware para parsear JSON y URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging simple
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas públicas
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API de Huevos Orgánicos - Backend funcionando 🥚",
    version: "1.0.0",
    endpoints: {
      auth: "/auth",
      productos: "/productos",
      clientes: "/clientes",
      health: "/health",
    },
  });
});

// Rutas API
console.log("🔌 Mounting auth routes...");
app.use("/auth", authRoutes);
app.use("/productos", productosRoutes);
app.use("/clientes", clientesRoutes);
app.use("/interesados", interesadosRoutes);
app.use("/pedidos", pedidosRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/carrito", carritoRoutes);

// Endpoint de health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Servidor funcionando correctamente",
    timestamp: new Date().toISOString(),
    database: "Conectado",
  });
});

// Info de la API
app.get("/info", (req, res) => {
  res.json({
    success: true,
    data: {
      nombre: "API Huevos Orgánicos",
      version: "1.0.0",
      descripcion: "Backend para el sistema de gestión de huevos orgánicos",
      autor: "Kevin Tenorio",
    },
  });
});

// Estadísticas simples
app.get("/stats", async (req, res) => {
  try {
    const pool = await import("./config/database.js").then(
      (mod) => mod.default
    );

    const [productosResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM productos WHERE estado = "activo"'
    );
    const totalProductos = productosResult[0].total;

    const [usuariosResult] = await pool.execute(
      "SELECT COUNT(*) as total FROM usuarios WHERE activo = TRUE"
    );
    const totalUsuarios = usuariosResult[0].total;

    res.json({
      success: true,
      data: { totalProductos, totalUsuarios, servidor: "Online" },
    });
  } catch (error) {
    console.error("❌ Error obteniendo estadísticas:", error);
    res
      .status(500)
      .json({ success: false, message: "Error obteniendo estadísticas" });
  }
});

// Middleware 404 para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
    path: req.originalUrl,
    method: req.method,
  });
});

// Middleware global de errores
app.use((error, req, res, next) => {
  console.error("🔥 Error global:", error);
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
  });
});

// Iniciar servidor solo si DB está lista
const startServer = async () => {
  try {
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error("❌ No se pudo conectar a la base de datos. Saliendo...");
      process.exit(1);
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🗄️ Base de datos: ${process.env.DB_NAME}`);
      console.log("\n📋 Endpoints disponibles:");
      console.log(" GET / - Información general");
      console.log(" GET /health - Estado del servidor");
      console.log(" GET /info - Información del API");
      console.log(" GET /stats - Estadísticas");
      console.log(" GET /productos - Lista de productos");
      console.log(" POST /auth/login - Login de usuarios");
    });
  } catch (error) {
    console.error("❌ Error iniciando servidor:", error);
    process.exit(1);
  }
};

startServer();
