import crypto from "crypto";
import pool from "../config/database.js";
import { enviarConfirmacionPedido, enviarCambioEstado, enviarNotificacionAdmin } from "../services/emailService.js";

const generarCodigo = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0,O,I,1 para evitar confusión
  const bytes = crypto.randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[bytes[i] % chars.length];
  return code.slice(0, 4) + "-" + code.slice(4);
};

const crearTablas = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      estado ENUM('pendiente','procesando','enviado','completado','cancelado') DEFAULT 'pendiente',
      metodo_pago ENUM('efectivo','transferencia','tarjeta') NOT NULL DEFAULT 'efectivo',
      estado_pago ENUM('pendiente','pagado') NOT NULL DEFAULT 'pendiente',
      total DECIMAL(10,2) NOT NULL,
      nota TEXT,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS detalle_pedidos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pedido_id INT NOT NULL,
      producto_id INT NOT NULL,
      cantidad INT NOT NULL,
      precio_unitario DECIMAL(10,2) NOT NULL,
      nombre_producto VARCHAR(255) NOT NULL,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
      FOREIGN KEY (producto_id) REFERENCES productos(id)
    )
  `);
};

crearTablas().catch((e) => console.error("Error creando tablas de pedidos:", e));

export const createPedido = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { items, nota, metodo_pago } = req.body;
    const usuarioId = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "El pedido debe tener al menos un producto" });
    }

    const metodosValidos = ["efectivo", "transferencia", "tarjeta"];
    if (!metodo_pago || !metodosValidos.includes(metodo_pago)) {
      return res.status(400).json({ error: "Método de pago no válido" });
    }

    // Validar stock de cada producto
    for (const item of items) {
      const [rows] = await conn.execute(
        "SELECT id, nombre, stock FROM productos WHERE id = ? AND estado = 'activo'",
        [item.producto_id]
      );
      if (rows.length === 0) {
        return res.status(400).json({ error: `Producto ${item.producto_id} no encontrado o inactivo` });
      }
      if (rows[0].stock < item.cantidad) {
        return res.status(400).json({ error: `Stock insuficiente para "${rows[0].nombre}"` });
      }
    }

    const total = items.reduce((sum, i) => sum + i.precio_unitario * i.cantidad, 0);

    // Generar código único (reintenta si colisiona)
    let codigo;
    for (let intentos = 0; intentos < 5; intentos++) {
      const candidato = generarCodigo();
      const [existe] = await conn.execute(
        "SELECT id FROM pedidos WHERE codigo_verificacion = ?", [candidato]
      );
      if (existe.length === 0) { codigo = candidato; break; }
    }
    if (!codigo) throw new Error("No se pudo generar código único");

    await conn.beginTransaction();

    const [pedidoResult] = await conn.execute(
      "INSERT INTO pedidos (usuario_id, total, nota, metodo_pago, codigo_verificacion) VALUES (?, ?, ?, ?, ?)",
      [usuarioId, total.toFixed(2), nota || null, metodo_pago, codigo]
    );
    const pedidoId = pedidoResult.insertId;

    for (const item of items) {
      await conn.execute(
        "INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, nombre_producto) VALUES (?, ?, ?, ?, ?)",
        [pedidoId, item.producto_id, item.cantidad, item.precio_unitario, item.nombre_producto]
      );
      // Descontar stock
      await conn.execute(
        "UPDATE productos SET stock = stock - ? WHERE id = ?",
        [item.cantidad, item.producto_id]
      );
    }

    await conn.commit();

    const [pedido] = await conn.execute(
      "SELECT p.*, u.nombre as cliente_nombre, u.email as cliente_email FROM pedidos p JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = ?",
      [pedidoId]
    );
    const [detalle] = await conn.execute(
      "SELECT * FROM detalle_pedidos WHERE pedido_id = ?",
      [pedidoId]
    );

    const pedidoCompleto = { ...pedido[0], items: detalle };

    // Emails no bloqueantes
    enviarConfirmacionPedido(pedido[0].cliente_nombre, pedido[0].cliente_email, pedidoCompleto);
    enviarNotificacionAdmin(pedidoCompleto);

    res.status(201).json({
      success: true,
      data: pedidoCompleto,
      message: "Pedido creado exitosamente",
    });
  } catch (error) {
    await conn.rollback();
    console.error("Error creando pedido:", error);
    res.status(500).json({ error: "Error del servidor al crear pedido" });
  } finally {
    conn.release();
  }
};

export const getMisPedidos = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const [pedidos] = await pool.execute(
      "SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY creado_en DESC",
      [usuarioId]
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
    console.error("Error obteniendo pedidos:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const getPedidoById = async (req, res) => {
  try {
    const { id } = req.params;
    const [pedidos] = await pool.execute(
      "SELECT p.*, u.nombre as cliente_nombre, u.email as cliente_email FROM pedidos p JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = ?",
      [id]
    );

    if (pedidos.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const pedido = pedidos[0];

    // Solo el dueño o un admin puede verlo
    if (pedido.usuario_id !== req.user.id && req.user.rol !== "admin") {
      return res.status(403).json({ error: "No tienes permiso para ver este pedido" });
    }

    const [detalle] = await pool.execute(
      `SELECT dp.*, p.codigo AS codigo_producto, p.unidad
       FROM detalle_pedidos dp
       LEFT JOIN productos p ON dp.producto_id = p.id
       WHERE dp.pedido_id = ?`,
      [id]
    );

    res.json({ success: true, data: { ...pedido, items: detalle } });
  } catch (error) {
    console.error("Error obteniendo pedido:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const getAllPedidos = async (req, res) => {
  try {
    const [pedidos] = await pool.execute(
      "SELECT p.*, u.nombre as cliente_nombre, u.email as cliente_email FROM pedidos p JOIN usuarios u ON p.usuario_id = u.id ORDER BY p.creado_en DESC"
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
    console.error("Error obteniendo todos los pedidos:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const verificarPedidoPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;
    const [pedidos] = await pool.execute(
      `SELECT p.*, u.nombre as cliente_nombre, u.email as cliente_email
       FROM pedidos p JOIN usuarios u ON p.usuario_id = u.id
       WHERE p.codigo_verificacion = ?`,
      [codigo.toUpperCase()]
    );

    if (pedidos.length === 0) {
      return res.status(404).json({ error: "Código no válido o pedido no encontrado" });
    }

    const pedido = pedidos[0];
    const [detalle] = await pool.execute(
      "SELECT * FROM detalle_pedidos WHERE pedido_id = ?",
      [pedido.id]
    );

    res.json({ success: true, data: { ...pedido, items: detalle } });
  } catch (error) {
    console.error("Error verificando pedido:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export const getPedidosPendientesCount = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT COUNT(*) as total FROM pedidos WHERE estado = 'pendiente'"
    );
    res.json({ success: true, data: { total: rows[0].total } });
  } catch (error) {
    res.status(500).json({ error: "Error del servidor" });
  }
};

const restaurarStock = async (pedidoId) => {
  const [items] = await pool.execute(
    "SELECT producto_id, cantidad FROM detalle_pedidos WHERE pedido_id = ?",
    [pedidoId]
  );
  for (const item of items) {
    await pool.execute(
      "UPDATE productos SET stock = stock + ? WHERE id = ?",
      [item.cantidad, item.producto_id]
    );
  }
};

export const cancelarPedidoCliente = async (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;
  const usuario_id = req.user.id;

  if (!motivo?.trim()) {
    return res.status(400).json({ error: "Debes indicar un motivo para cancelar el pedido" });
  }

  try {
    const [pedidos] = await pool.execute(
      "SELECT id, estado, usuario_id FROM pedidos WHERE id = ? AND usuario_id = ?",
      [id, usuario_id]
    );

    if (pedidos.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const pedido = pedidos[0];
    const cancelables = ["pendiente", "procesando"];

    if (!cancelables.includes(pedido.estado)) {
      const estadoLabel = { enviado: "En Camino", completado: "Entregado", cancelado: "ya cancelado" };
      return res.status(400).json({
        error: `No puedes cancelar este pedido porque está ${estadoLabel[pedido.estado] || pedido.estado}. Solo se pueden cancelar pedidos Pendientes o En Preparación.`,
      });
    }

    await restaurarStock(id);

    await pool.execute(
      "UPDATE pedidos SET estado = 'cancelado', motivo_cancelacion = ? WHERE id = ?",
      [motivo.trim(), id]
    );

    res.json({ success: true, message: "Pedido cancelado. El stock fue restaurado." });
  } catch (err) {
    console.error("Error cancelarPedidoCliente:", err);
    res.status(500).json({ error: "Error al cancelar el pedido" });
  }
};

export const updateEstadoPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, motivo } = req.body;
    const estadosValidos = ["pendiente", "procesando", "enviado", "completado", "cancelado"];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: "Estado no válido" });
    }

    if (estado === "cancelado" && !motivo?.trim()) {
      return res.status(400).json({ error: "Debes indicar un motivo para cancelar el pedido" });
    }

    const [existing] = await pool.execute("SELECT estado FROM pedidos WHERE id = ?", [id]);
    if (existing.length === 0) return res.status(404).json({ error: "Pedido no encontrado" });

    if (estado === "cancelado") {
      await restaurarStock(id);
      await pool.execute(
        "UPDATE pedidos SET estado = 'cancelado', motivo_cancelacion = ? WHERE id = ?",
        [motivo.trim(), id]
      );
    } else {
      await pool.execute("UPDATE pedidos SET estado = ? WHERE id = ?", [estado, id]);
    }

    // Email de cambio de estado (no bloqueante)
    const [pedidoData] = await pool.execute(
      `SELECT p.total, p.metodo_pago,
        COALESCE(u.nombre, c.contacto_nombre) AS cliente_nombre,
        COALESCE(u.email, c.email) AS cliente_email
       FROM pedidos p
       LEFT JOIN usuarios u ON p.usuario_id = u.id
       LEFT JOIN clientes c ON p.cliente_id = c.id
       WHERE p.id = ?`,
      [id]
    );
    if (pedidoData.length > 0) {
      const [items] = await pool.execute(
        `SELECT dp.nombre_producto, dp.cantidad, dp.precio_unitario, pr.unidad
         FROM detalle_pedidos dp
         LEFT JOIN productos pr ON dp.producto_id = pr.id
         WHERE dp.pedido_id = ?`,
        [id]
      );
      enviarCambioEstado(pedidoData[0].cliente_nombre, pedidoData[0].cliente_email, {
        id, estado, total: pedidoData[0].total, items,
      });
    }

    res.json({ success: true, message: `Pedido actualizado a "${estado}"` });
  } catch (error) {
    console.error("Error actualizando estado:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};
