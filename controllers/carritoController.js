import pool from "../config/database.js";

pool.execute(`
  CREATE TABLE IF NOT EXISTS carrito (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY usuario_producto (usuario_id, producto_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
  )
`).catch(e => console.error("Error creando tabla carrito:", e));

export const getCarrito = async (req, res) => {
  try {
    const [items] = await pool.execute(
      `SELECT c.producto_id, c.cantidad, p.nombre, p.precio, p.imagen, p.stock
       FROM carrito c
       JOIN productos p ON c.producto_id = p.id
       WHERE c.usuario_id = ? AND p.estado = 'activo'`,
      [req.user.id]
    );
    res.json({ success: true, data: items });
  } catch (error) {
    console.error("Error obteniendo carrito:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const syncCarrito = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: "items debe ser un array" });

    await conn.beginTransaction();

    // Eliminar carrito actual del usuario
    await conn.execute("DELETE FROM carrito WHERE usuario_id = ?", [req.user.id]);

    // Insertar items válidos (verificando stock)
    for (const item of items) {
      const [rows] = await conn.execute(
        "SELECT id, stock FROM productos WHERE id = ? AND estado = 'activo'",
        [item.producto_id]
      );
      if (rows.length === 0) continue;
      const cantidad = Math.min(item.cantidad, rows[0].stock);
      if (cantidad <= 0) continue;
      await conn.execute(
        "INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)",
        [req.user.id, item.producto_id, cantidad]
      );
    }

    await conn.commit();

    const [carritoActual] = await conn.execute(
      `SELECT c.producto_id, c.cantidad, p.nombre, p.precio, p.imagen, p.stock
       FROM carrito c JOIN productos p ON c.producto_id = p.id
       WHERE c.usuario_id = ? AND p.estado = 'activo'`,
      [req.user.id]
    );

    res.json({ success: true, data: carritoActual });
  } catch (error) {
    await conn.rollback();
    console.error("Error sincronizando carrito:", error);
    res.status(500).json({ error: "Error del servidor" });
  } finally {
    conn.release();
  }
};

export const clearCarritoDB = async (req, res) => {
  try {
    await pool.execute("DELETE FROM carrito WHERE usuario_id = ?", [req.user.id]);
    res.json({ success: true, message: "Carrito vaciado" });
  } catch (error) {
    console.error("Error vaciando carrito:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};
