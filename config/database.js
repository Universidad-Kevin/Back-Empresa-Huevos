import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

// ---------------------------------------------------------------------------
// Host resolution order:
//   1. DB_HOST          – explicit override (local dev / custom Railway var)
//   2. MYSQLHOST        – Railway reference variable (works when resolved)
//   3. RAILWAY_PRIVATE_DOMAIN – Railway-injected private domain for THIS service
//                         (only useful when the app and MySQL share a service,
//                          which is uncommon; kept as a safety net)
//   4. mysql.railway.internal – Railway internal DNS for a service named "mysql"
//                         This is the reliable fallback when reference variables
//                         are not injected into the container.
// ---------------------------------------------------------------------------
const resolvedHost =
  process.env.DB_HOST ||
  process.env.MYSQLHOST ||
  process.env.RAILWAY_PRIVATE_DOMAIN ||
  "mysql.railway.internal";

// ---------------------------------------------------------------------------
// Credential resolution order:
//   1. Explicit DB_* vars (local dev / custom Railway vars)
//   2. MYSQL* vars from Railway reference variables (when they resolve)
//   3. Railway MySQL template defaults: root / railway / 3306
//      MYSQL_ROOT_PASSWORD is set by the Railway MySQL template and IS
//      injected into the same service, unlike cross-service reference vars.
// ---------------------------------------------------------------------------
const resolvedUser     = process.env.DB_USER     || process.env.MYSQLUSER     || "root";
const resolvedPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_ROOT_PASSWORD || "";
const resolvedDatabase = process.env.DB_NAME     || process.env.MYSQLDATABASE || "railway";
const resolvedPort     = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || "3306", 10);

// Config individual — usado como fallback y para el bootstrap (multipleStatements)
const baseConfig = {
  host:     resolvedHost,
  port:     resolvedPort,
  user:     resolvedUser,
  password: resolvedPassword,
  database: resolvedDatabase,
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
