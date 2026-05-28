import pool from "../config/database.js";
import bcrypt from "bcryptjs";
import { enviarContactoMayorista } from "../services/emailService.js";

export const getMiPerfil = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, nombre_empresa, contacto_nombre, email, ruc, telefono, direccion, limite_credito, estado, creado_en FROM clientes WHERE id = ?",
      [req.cliente.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Cliente no encontrado" });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error obteniendo perfil mayorista:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const getMisPedidos = async (req, res) => {
  try {
    const [pedidos] = await pool.execute(
      "SELECT * FROM pedidos WHERE cliente_id = ? ORDER BY creado_en DESC",
      [req.cliente.id]
    );
    for (const pedido of pedidos) {
      const [detalle] = await pool.execute(
        `SELECT dp.*, p.codigo AS codigo_producto, p.unidad
         FROM detalle_pedidos dp
         LEFT JOIN productos p ON dp.producto_id = p.id
         WHERE dp.pedido_id = ?`,
        [pedido.id]
      );
      pedido.items = detalle;
    }
    res.json({ success: true, data: pedidos });
  } catch (error) {
    console.error("Error obteniendo pedidos mayorista:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const getPedidoById = async (req, res) => {
  try {
    const { id } = req.params;
    const [pedidos] = await pool.execute(
      "SELECT p.*, c.nombre_empresa, c.contacto_nombre AS cliente_nombre, c.email AS cliente_email FROM pedidos p JOIN clientes c ON p.cliente_id = c.id WHERE p.id = ? AND p.cliente_id = ?",
      [id, req.cliente.id]
    );
    if (pedidos.length === 0) return res.status(404).json({ error: "Pedido no encontrado" });

    const [detalle] = await pool.execute(
      `SELECT dp.*, p.codigo AS codigo_producto, p.unidad
       FROM detalle_pedidos dp
       LEFT JOIN productos p ON dp.producto_id = p.id
       WHERE dp.pedido_id = ?`,
      [id]
    );
    res.json({ success: true, data: { ...pedidos[0], items: detalle } });
  } catch (error) {
    console.error("Error obteniendo pedido mayorista:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const enviarContacto = async (req, res) => {
  try {
    const { asunto, mensaje } = req.body;
    if (!asunto?.trim() || !mensaje?.trim()) {
      return res.status(400).json({ error: "Asunto y mensaje son requeridos" });
    }

    const [rows] = await pool.execute(
      "SELECT nombre_empresa, contacto_nombre, email, telefono FROM clientes WHERE id = ?",
      [req.cliente.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Cliente no encontrado" });

    await enviarContactoMayorista(rows[0], { asunto: asunto.trim(), mensaje: mensaje.trim() });

    res.json({ success: true, message: "Mensaje enviado correctamente" });
  } catch (error) {
    console.error("Error enviando contacto mayorista:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const createPedidoMayorista = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { cliente_id, items, nota, metodo_pago } = req.body;

    if (!cliente_id || !items?.length) {
      return res.status(400).json({ error: "cliente_id e items son requeridos" });
    }

    const [clienteRows] = await conn.execute(
      "SELECT id, nombre_empresa, contacto_nombre, email FROM clientes WHERE id = ? AND estado = 'activo'",
      [cliente_id]
    );
    if (clienteRows.length === 0) return res.status(404).json({ error: "Cliente mayorista no encontrado" });
    const cliente = clienteRows[0];

    const total = items.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);

    await conn.beginTransaction();

    const [result] = await conn.execute(
      "INSERT INTO pedidos (cliente_id, usuario_id, total, nota, metodo_pago, estado) VALUES (?, NULL, ?, ?, ?, 'pendiente')",
      [cliente_id, total.toFixed(2), nota || null, metodo_pago || "efectivo"]
    );
    const pedidoId = result.insertId;

    for (const item of items) {
      await conn.execute(
        "INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, nombre_producto) VALUES (?, ?, ?, ?, ?)",
        [pedidoId, item.producto_id, item.cantidad, item.precio_unitario, item.nombre_producto]
      );
      await conn.execute(
        "UPDATE productos SET stock = stock - ? WHERE id = ?",
        [item.cantidad, item.producto_id]
      );
    }

    await conn.commit();

    const [pedido] = await conn.execute("SELECT * FROM pedidos WHERE id = ?", [pedidoId]);
    const [detalle] = await conn.execute(
      `SELECT dp.*, p.codigo AS codigo_producto, p.unidad
       FROM detalle_pedidos dp LEFT JOIN productos p ON dp.producto_id = p.id
       WHERE dp.pedido_id = ?`,
      [pedidoId]
    );

    const pedidoCompleto = {
      ...pedido[0],
      cliente_nombre: cliente.contacto_nombre,
      cliente_email: cliente.email,
      nombre_empresa: cliente.nombre_empresa,
      items: detalle,
    };

    res.status(201).json({ success: true, data: pedidoCompleto, message: "Pedido mayorista creado" });
  } catch (error) {
    await conn.rollback();
    console.error("Error creando pedido mayorista:", error);
    res.status(500).json({ error: "Error del servidor al crear pedido" });
  } finally {
    conn.release();
  }
};
