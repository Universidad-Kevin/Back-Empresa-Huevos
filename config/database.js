import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

// 🔍 Validar variable de entorno
if (!process.env.DATABASE_URL) {
  console.error("❌ Error: Falta la variable de entorno DATABASE_URL");
  process.exit(1);
}

// ⚙️ Configuración del pool de PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // necesario para Render
  },
});

// 🧪 Probar conexión inicial
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Conexión a PostgreSQL establecida correctamente");

    // Verificar tablas
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);

    console.log(
      `📊 Tablas detectadas en la base de datos: ${result.rows.length}`
    );
    client.release();
    return true;
  } catch (error) {
    console.error("❌ Error conectando a PostgreSQL:", error.message);
    return false;
  }
};

// 🔁 Reintento automático ante error de conexión
pool.on("error", (err) => {
  console.error("⚠️ Error inesperado en el pool de PostgreSQL:", err.message);
});

export default pool;
