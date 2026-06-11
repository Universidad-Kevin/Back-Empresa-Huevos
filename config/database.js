import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

console.log("=== DATABASE CONFIG ===");
console.log("host    :", resolvedHost);
console.log("port    :", resolvedPort);
console.log("user    :", resolvedUser);
console.log("database:", resolvedDatabase);
console.log("password:", resolvedPassword ? `SET (${resolvedPassword.length} chars)` : "EMPTY — connection may fail");
console.log("=======================");

const baseConfig = {
  host:     resolvedHost,
  port:     resolvedPort,
  user:     resolvedUser,
  password: resolvedPassword,
  database: resolvedDatabase,
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
