// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
import { testConnection, runBootstrap } from "./config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Rutas
import authRoutes from "./routes/auth.js";
import clientesRoutes from "./routes/clientes.js";
import productosRoutes from "./routes/productos.js";
import interesadosRoutes from "./routes/interesados.js";
import pedidosRoutes from "./routes/pedidos.js";
import usuariosRoutes from "./routes/usuarios.js";
import carritoRoutes from "./routes/carrito.js";
import mayoristaRoutes from "./routes/mayorista.js";
import categoriasRoutes from "./routes/categorias.js";
import marcasRoutes from "./routes/marcas.js";
import inventarioRoutes from "./routes/inventario.js";
import proveedoresRoutes from "./routes/proveedores.js";
import pagosRoutes from "./routes/pagos.js";
import facturasRoutes from "./routes/facturas.js";
import cuponesRoutes from "./routes/cupones.js";
import favoritosRoutes from "./routes/favoritos.js";
import valoracionesRoutes from "./routes/valoraciones.js";
import notificacionesRoutes from "./routes/notificaciones.js";
import auditoriaRoutes from "./routes/auditoria.js";
import { auditMiddleware } from "./middleware/auditoria.js";
import { authenticateToken } from "./middleware/auth.js";

if (process.env.NODE_ENV !== "production") { dotenv.config(); }


// Guardia de seguridad al arranque
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("❌ FATAL: JWT_SECRET no configurado o es demasiado corto (< 32 chars). Configúralo en las variables de entorno antes de arrancar.");
  process.exit(1);
}
if (process.env.NODE_ENV === "production" && !process.env.FRONTEND_URL) {
  console.warn("⚠️  FRONTEND_URL no configurado en producción. CORS aceptará cualquier origen.");
}

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

app.use(auditMiddleware);

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
app.use("/mayorista", mayoristaRoutes);
app.use("/categorias", categoriasRoutes);
app.use("/marcas", marcasRoutes);
app.use("/inventario", inventarioRoutes);
app.use("/proveedores", proveedoresRoutes);
app.use("/pagos", pagosRoutes);
app.use("/facturas", facturasRoutes);
app.use("/cupones", cuponesRoutes);
app.use("/favoritos", favoritosRoutes);
app.use("/valoraciones", valoracionesRoutes);
app.use("/notificaciones", notificacionesRoutes);
app.use("/auditoria", auditoriaRoutes);

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

// Estadísticas admin — protegidas
app.get("/admin/estadisticas", authenticateToken, async (req, res) => {
  if (req.user.rol !== "admin") return res.status(403).json({ error: "Solo admin" });
  try {
    const pool = await import("./config/database.js").then(m => m.default);

    const [[ventasMes]] = await pool.execute(`
      SELECT COALESCE(SUM(total),0) AS total, COUNT(*) AS pedidos
      FROM pedidos
      WHERE MONTH(creado_en)=MONTH(NOW()) AND YEAR(creado_en)=YEAR(NOW()) AND estado != 'cancelado'`);

    const [[ventasAnterior]] = await pool.execute(`
      SELECT COALESCE(SUM(total),0) AS total
      FROM pedidos
      WHERE MONTH(creado_en)=MONTH(DATE_SUB(NOW(),INTERVAL 1 MONTH))
        AND YEAR(creado_en)=YEAR(DATE_SUB(NOW(),INTERVAL 1 MONTH))
        AND estado != 'cancelado'`);

    const [[clientesNuevos]] = await pool.execute(`
      SELECT COUNT(*) AS total FROM usuarios
      WHERE rol = 'cliente' AND creado_en >= DATE_SUB(NOW(), INTERVAL 30 DAY)`);

    const [topProductos] = await pool.execute(`
      SELECT p.nombre, SUM(dp.cantidad) AS unidades, SUM(dp.cantidad * dp.precio_unitario) AS ingresos
      FROM detalle_pedidos dp
      JOIN productos p ON dp.producto_id = p.id
      JOIN pedidos pe ON dp.pedido_id = pe.id
      WHERE pe.estado != 'cancelado'
      GROUP BY p.id, p.nombre
      ORDER BY unidades DESC LIMIT 5`);

    const [tendencias] = await pool.execute(`
      SELECT DATE_FORMAT(creado_en,'%Y-%m') AS mes,
             DATE_FORMAT(creado_en,'%b') AS mes_corto,
             SUM(total) AS total, COUNT(*) AS pedidos
      FROM pedidos
      WHERE creado_en >= DATE_SUB(NOW(), INTERVAL 6 MONTH) AND estado != 'cancelado'
      GROUP BY mes, mes_corto ORDER BY mes`);

    const [ventasDiarias] = await pool.execute(`
      SELECT DATE(creado_en) AS dia,
             SUM(total) AS total,
             COUNT(*) AS pedidos
      FROM pedidos
      WHERE creado_en >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND estado != 'cancelado'
      GROUP BY dia ORDER BY dia`);

    const [pedidosPorEstado] = await pool.execute(`
      SELECT estado, COUNT(*) AS total FROM pedidos GROUP BY estado ORDER BY total DESC`);

    const prev = parseFloat(ventasAnterior.total);
    const curr = parseFloat(ventasMes.total);
    const crecimiento = prev > 0 ? (((curr - prev) / prev) * 100).toFixed(1) : null;

    res.json({
      success: true,
      data: {
        ventas_mes: curr,
        pedidos_mes: ventasMes.pedidos,
        ventas_mes_anterior: prev,
        crecimiento,
        clientes_nuevos: clientesNuevos.total,
        top_productos: topProductos,
        tendencias,
        ventas_diarias: ventasDiarias,
        pedidos_por_estado: pedidosPorEstado,
      },
    });
  } catch (e) {
    console.error("Error estadísticas admin:", e);
    res.status(500).json({ error: "Error del servidor" });
  }
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

// Frontend estático — solo en producción, cuando el build existe
const publicDir = join(__dirname, "public");
if (process.env.NODE_ENV === "production" && existsSync(publicDir)) {
  app.use(express.static(publicDir));
  // SPA fallback: cualquier ruta no-API devuelve index.html
  app.get("*", (req, res) => {
    res.sendFile(join(publicDir, "index.html"));
  });
} else {
  // Middleware 404 para rutas no encontradas (solo en desarrollo)
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: "Ruta no encontrada",
      path: req.originalUrl,
      method: req.method,
    });
  });
}

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

    await runBootstrap();

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
