import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Soporta tanto los nombres locales (DB_HOST) como los del plugin MySQL de Railway (MYSQLHOST)
const baseConfig = {
  host: process.env.DB_HOST || process.env.MYSQLHOST,
  port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || "3306"),
  user: process.env.DB_USER || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
  database: process.env.DB_NAME || process.env.MYSQLDATABASE,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
};

const pool = mysql.createPool({
  ...baseConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Conexión a MySQL establecida correctamente");
    const [tables] = await connection.execute("SHOW TABLES");
    console.log(`📊 Tablas en la base de datos: ${tables.length}`);
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Error conectando a MySQL:", error.message);
    return false;
  }
};

// Corre bootstrap.sql solo si la BD está vacía (BD nueva en Railway u otro proveedor).
// En BD existente con tablas ya migradas, se omite.
export const runBootstrap = async () => {
  const [[{ cnt }]] = await pool.execute(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = 'notificaciones'`
  );

  if (cnt > 0) {
    console.log("✅ BD ya inicializada, omitiendo bootstrap");
    return;
  }

  console.log("🔧 BD vacía detectada — ejecutando bootstrap...");
  const bootstrapPath = join(__dirname, "..", "bootstrap.sql");
  const sql = readFileSync(bootstrapPath, "utf8");

  // Conexión dedicada con multipleStatements (solo para este script controlado)
  const conn = await mysql.createConnection({ ...baseConfig, multipleStatements: true });
  try {
    await conn.query(sql);
    console.log("✅ Bootstrap de BD completado");
  } catch (err) {
    console.error("❌ Error en bootstrap de BD:", err.message);
    throw err;
  } finally {
    await conn.end();
  }
};

export default pool;
