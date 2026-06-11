import pool from "../config/database.js";
import { enviarAlertaStockBajo } from "../services/emailService.js";

const THROTTLE_HORAS = 24;

// ─── helpers internos ────────────────────────────────────────────────────────

export const registrarMovimiento = async (conn, {
  producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, usuario_id, pedido_id, proveedor_id,
}) => {
  await conn.execute(
    `INSERT INTO movimientos_inventario
     (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, usuario_id, pedido_id, proveedor_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo || null, usuario_id || null, pedido_id || null, proveedor_id || null]
  );
};

export const verificarAlertaStock = async (producto_id) => {
  try {
    const [[prod]] = await pool.execute(
      "SELECT id, nombre, stock, COALESCE(stock_minimo, 5) AS stock_minimo, ultima_alerta_stock_en FROM productos WHERE id = ?",
      [producto_id]
    );
    if (!prod || prod.stock > prod.stock_minimo) return;

    if (prod.ultima_alerta_stock_en) {
      const horas = (Date.now() - new Date(prod.ultima_alerta_stock_en).getTime()) / 3_600_000;
      if (horas < THROTTLE_HORAS) return;
    }

    await pool.execute("UPDATE productos SET ultima_alerta_stock_en = NOW() WHERE id = ?", [producto_id]);
    enviarAlertaStockBajo(prod).catch(e => console.error("Error alerta stock:", e.message));
  } catch (e) {
    console.warn("verificarAlertaStock error:", e.message);
  }
};

// ─── GET /inventario ─────────────────────────────────────────────────────────

export const getInventario = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         p.id, p.codigo, p.nombre, p.categoria, p.stock,
         COALESCE(p.stock_minimo, 5) AS stock_minimo,
         p.unidad, p.estado,
         (p.stock <= COALESCE(p.stock_minimo, 5)) AS alerta_stock,
         c.nombre AS categoria_nombre
       FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       ORDER BY p.nombre ASC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("getInventario:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// ─── POST /inventario/entrada ─────────────────────────────────────────────────

export const entradaInventario = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { producto_id, cantidad, motivo, proveedor_id } = req.body;
    const usuario_id = req.user?.id;

    if (!producto_id || !cantidad || cantidad <= 0) {
      return res.status(400).json({ error: "producto_id y cantidad (positivo) son requeridos" });
    }

    const [[prod]] = await conn.execute("SELECT id, stock FROM productos WHERE id = ?", [producto_id]);
    if (!prod) return res.status(404).json({ error: "Producto no encontrado" });

    const stockAnterior = prod.stock;
    const stockNuevo = stockAnterior + parseInt(cantidad);

    await conn.beginTransaction();
    await conn.execute("UPDATE productos SET stock = ? WHERE id = ?", [stockNuevo, producto_id]);
    await registrarMovimiento(conn, {
      producto_id, tipo: "entrada", cantidad: parseInt(cantidad),
      stock_anterior: stockAnterior, stock_nuevo: stockNuevo,
      motivo, usuario_id, proveedor_id: proveedor_id || null,
    });
    await conn.commit();

    res.json({ success: true, stock_nuevo: stockNuevo, message: `Entrada de ${cantidad} unidades registrada` });
  } catch (error) {
    await conn.rollback();
    console.error("entradaInventario:", error);
    res.status(500).json({ error: "Error del servidor" });
  } finally {
    conn.release();
  }
};

// ─── POST /inventario/salida ──────────────────────────────────────────────────

export const salidaInventario = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { producto_id, cantidad, motivo } = req.body;
    const usuario_id = req.user?.id;

    if (!producto_id || !cantidad || cantidad <= 0) {
      return res.status(400).json({ error: "producto_id y cantidad (positivo) son requeridos" });
    }

    const [[prod]] = await conn.execute("SELECT id, stock FROM productos WHERE id = ?", [producto_id]);
    if (!prod) return res.status(404).json({ error: "Producto no encontrado" });
    if (prod.stock < cantidad) {
      return res.status(400).json({ error: `Stock insuficiente. Disponible: ${prod.stock}` });
    }

    const stockAnterior = prod.stock;
    const stockNuevo = stockAnterior - parseInt(cantidad);

    await conn.beginTransaction();
    await conn.execute("UPDATE productos SET stock = ? WHERE id = ?", [stockNuevo, producto_id]);
    await registrarMovimiento(conn, {
      producto_id, tipo: "salida", cantidad: -parseInt(cantidad),
      stock_anterior: stockAnterior, stock_nuevo: stockNuevo,
      motivo, usuario_id,
    });
    await conn.commit();

    verificarAlertaStock(producto_id);
    res.json({ success: true, stock_nuevo: stockNuevo, message: `Salida de ${cantidad} unidades registrada` });
  } catch (error) {
    await conn.rollback();
    console.error("salidaInventario:", error);
    res.status(500).json({ error: "Error del servidor" });
  } finally {
    conn.release();
  }
};

// ─── POST /inventario/ajuste ──────────────────────────────────────────────────

export const ajusteInventario = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { producto_id, cantidad_nueva, motivo } = req.body;
    const usuario_id = req.user?.id;

    if (!producto_id || cantidad_nueva === undefined || cantidad_nueva === null || cantidad_nueva < 0) {
      return res.status(400).json({ error: "producto_id y cantidad_nueva (≥ 0) son requeridos" });
    }

    const [[prod]] = await conn.execute("SELECT id, stock FROM productos WHERE id = ?", [producto_id]);
    if (!prod) return res.status(404).json({ error: "Producto no encontrado" });

    const stockAnterior = prod.stock;
    const stockNuevo = parseInt(cantidad_nueva);
    const delta = stockNuevo - stockAnterior;

    if (delta === 0) {
      return res.json({ success: true, stock_nuevo: stockNuevo, message: "Sin cambios en el stock" });
    }

    await conn.beginTransaction();
    await conn.execute("UPDATE productos SET stock = ? WHERE id = ?", [stockNuevo, producto_id]);
    await registrarMovimiento(conn, {
      producto_id, tipo: "ajuste", cantidad: delta,
      stock_anterior: stockAnterior, stock_nuevo: stockNuevo,
      motivo: motivo || `Ajuste manual: ${stockAnterior} → ${stockNuevo}`, usuario_id,
    });
    await conn.commit();

    if (delta < 0) verificarAlertaStock(producto_id);
    res.json({ success: true, stock_nuevo: stockNuevo, message: `Stock ajustado a ${stockNuevo} unidades` });
  } catch (error) {
    await conn.rollback();
    console.error("ajusteInventario:", error);
    res.status(500).json({ error: "Error del servidor" });
  } finally {
    conn.release();
  }
};

// ─── PATCH /inventario/:id/stock-minimo ───────────────────────────────────────

export const updateStockMinimo = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_minimo } = req.body;
    if (stock_minimo === undefined || stock_minimo < 0) {
      return res.status(400).json({ error: "stock_minimo debe ser un número ≥ 0" });
    }
    const [result] = await pool.execute(
      "UPDATE productos SET stock_minimo = ? WHERE id = ?",
      [parseInt(stock_minimo), id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Producto no encontrado" });
    res.json({ success: true, message: "Stock mínimo actualizado" });
  } catch (error) {
    console.error("updateStockMinimo:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// ─── GET /inventario/movimientos ──────────────────────────────────────────────

export const getMovimientos = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { producto_id, tipo } = req.query;

    const conditions = [];
    const params = [];
    if (producto_id) { conditions.push("m.producto_id = ?"); params.push(producto_id); }
    if (tipo) { conditions.push("m.tipo = ?"); params.push(tipo); }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM movimientos_inventario m ${where}`, params
    );

    const [rows] = await pool.execute(
      `SELECT m.*, p.nombre AS producto_nombre, p.unidad,
              u.nombre AS usuario_nombre, pv.nombre AS proveedor_nombre
       FROM movimientos_inventario m
       LEFT JOIN productos p   ON m.producto_id = p.id
       LEFT JOIN usuarios u    ON m.usuario_id = u.id
       LEFT JOIN proveedores pv ON m.proveedor_id = pv.id
       ${where}
       ORDER BY m.creado_en DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: { total, page, limit, total_paginas: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("getMovimientos:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};
