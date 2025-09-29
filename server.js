import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';

// Importar rutas
import authRoutes from './routes/auth.js';
import productosRoutes from './routes/productos.js';

// Configurar environment
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // URL de tu frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Huevos Orgánicos - Backend funcionando',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      productos: '/api/productos',
      health: '/api/health'
    }
  });
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    database: 'Conectado'
  });
});

// Ruta de información
app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    data: {
      nombre: 'API Huevos Orgánicos',
      version: '1.0.0',
      descripcion: 'Backend para sistema de gestión de huevos orgánicos',
      autor: 'Tu Nombre'
    }
  });
});

// Ruta para obtener estadísticas básicas
app.get('/api/stats', async (req, res) => {
  try {
    const pool = await import('./config/database.js').then(mod => mod.default);
    
    // Obtener conteo de productos
    const [productosResult] = await pool.execute('SELECT COUNT(*) as total FROM productos WHERE estado = "activo"');
    const totalProductos = productosResult[0].total;
    
    // Obtener conteo de usuarios
    const [usuariosResult] = await pool.execute('SELECT COUNT(*) as total FROM usuarios WHERE activo = TRUE');
    const totalUsuarios = usuariosResult[0].total;

    res.json({
      success: true,
      data: {
        totalProductos,
        totalUsuarios,
        servidor: 'Online'
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas'
    });
  }
});

// Manejo de rutas no encontradas - CORREGIDO
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error global:', error);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

// Inicializar servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos. Saliendo...');
      process.exit(1);
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🗄️ Base de datos: ${process.env.DB_NAME}`);
      console.log('\n📋 Endpoints disponibles:');
      console.log('   GET  /              - Información de la API');
      console.log('   GET  /api/health    - Estado del servidor');
      console.log('   GET  /api/info      - Información del API');
      console.log('   GET  /api/stats     - Estadísticas básicas');
      console.log('   GET  /api/productos - Lista de productos');
      console.log('   POST /api/auth/login - Login de usuarios');
    });

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

startServer();