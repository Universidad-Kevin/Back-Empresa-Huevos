import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();
// Configuración de la conexión a MySQL
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);
// Probar conexión
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Conexión a MySQL establecida correctamente");
    // Verificar que las tablas existen
    const [tables] = await connection.execute("SHOW TABLES");
    console.log(`📊 Tablas en la base de datos: ${tables.length}`);
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Error conectando a MySQL:", error.message);
    return false;
  }
};

export default pool;
