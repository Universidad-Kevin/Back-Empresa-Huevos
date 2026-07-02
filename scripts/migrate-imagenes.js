/**
 * Migración única: convierte imágenes base64 almacenadas en MySQL a Cloudinary.
 *
 * Uso:
 *   node scripts/migrate-imagenes.js
 *
 * Variables de entorno necesarias (ya configuradas en Railway o en .env):
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 */

import "dotenv/config";
import pool from "../config/database.js";
import { uploadBuffer } from "../config/cloudinary.js";

async function run() {
  const [rows] = await pool.query(
    "SELECT id, nombre FROM productos WHERE imagen LIKE 'data:%'"
  );

  console.log(`Productos con imagen en base64: ${rows.length}`);
  if (rows.length === 0) {
    console.log("Nada que migrar.");
    process.exit(0);
  }

  let ok = 0;
  let fail = 0;

  for (const p of rows) {
    try {
      const [[full]] = await pool.query(
        "SELECT imagen FROM productos WHERE id = ?",
        [p.id]
      );

      const base64Data = full.imagen.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const result = await uploadBuffer(buffer, {
        public_id: `producto-${p.id}`,
        overwrite: true,
      });

      await pool.execute(
        "UPDATE productos SET imagen = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?",
        [result.secure_url, p.id]
      );

      console.log(`  ✅ #${p.id} ${p.nombre} → ${result.secure_url}`);
      ok++;
    } catch (e) {
      console.error(`  ❌ #${p.id} ${p.nombre}: ${e.message}`);
      fail++;
    }
  }

  console.log(`\nListo: ${ok} migrados, ${fail} fallidos.`);
  await pool.end();
  process.exit(fail > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error("Error fatal:", e);
  process.exit(1);
});
