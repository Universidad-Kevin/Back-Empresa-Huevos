import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

// Config individual — usado como fallback y para el bootstrap (multipleStatements)
const baseConfig = {
  host: process.env.DB_HOST || process.env.MYSQLHOST,
  port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || "3306"),
  user: process.env.DB_USER || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
  database: process.env.DB_NAME || process.env.MYSQLDATABASE,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
};

const poolConfig = connectionUrl
  ? { uri: connectionUrl, ssl: { rejectUnauthorized: false }, waitForConnections: true, connectionLimit: 10, queueLimit: 0 }
  : { ...baseConfig, waitForConnections: true, connectionLimit: 10, queueLimit: 0 };

const pool = mysql.createPool(poolConfig);

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
// En BD existente con tablas ya migradas, aplica solo las migraciones pendientes.
export const runBootstrap = async () => {
  const [[{ cnt }]] = await pool.execute(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = 'notificaciones'`
  );

  const connConfig = connectionUrl
    ? { uri: connectionUrl, ssl: { rejectUnauthorized: false }, multipleStatements: true }
    : { ...baseConfig, multipleStatements: true };

  if (cnt === 0) {
    console.log("🔧 BD vacía detectada — ejecutando bootstrap...");
    const bootstrapPath = join(__dirname, "..", "bootstrap.sql");
    const sql = readFileSync(bootstrapPath, "utf8");
    const conn = await mysql.createConnection(connConfig);
    try {
      await conn.query(sql);
      console.log("✅ Bootstrap de BD completado");
    } catch (err) {
      console.error("❌ Error en bootstrap de BD:", err.message);
      throw err;
    } finally {
      await conn.end();
    }
  } else {
    console.log("✅ BD ya inicializada, aplicando migraciones pendientes...");
    await runMigrations(connConfig);
  }
};

const runMigrations = async (connConfig) => {
  const migrationsDir = join(__dirname, "..", "migrations");
  let files;
  try {
    const { readdirSync } = await import("fs");
    files = readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();
  } catch {
    return;
  }

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename VARCHAR(255) PRIMARY KEY,
      aplicada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [aplicadas] = await pool.execute("SELECT filename FROM _migrations");
  const aplicadasSet = new Set(aplicadas.map(r => r.filename));

  const conn = await mysql.createConnection(connConfig);
  try {
    for (const file of files) {
      if (aplicadasSet.has(file)) continue;
      const sql = readFileSync(join(migrationsDir, file), "utf8");
      try {
        await conn.query(sql);
        await pool.execute("INSERT INTO _migrations (filename) VALUES (?)", [file]);
        console.log(`✅ Migración aplicada: ${file}`);
      } catch (err) {
        console.error(`❌ Error en migración ${file}:`, err.message);
      }
    }
  } finally {
    await conn.end();
  }
};

export default pool;
