import crypto from "crypto";
import pool from "../config/database.js";
import { enviarConfirmacionPedido, enviarCambioEstado, enviarNotificacionAdmin } from "../services/emailService.js";
import { crearNotificacion, MENSAJES } from "../services/notificacionesService.js";
import { registrarMovimiento, verificarAlertaStock } from "./inventarioController.js";
import { _validarLogica, _calcularDescuento } from "./cuponesController.js";

const generarCodigo = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0,O,I,1 para evitar confusión
  const bytes = crypto.randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[bytes[i] % chars.length];
  return code.slice(0, 4) + "-" + code.slice(4);
};


export const createPedido = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { items, nota, metodo_pago, cupon_codigo,
            dir_calle, dir_distrito, dir_referencia } = req.body;
    const usuarioId = req.user.id;

    // Validaciones sin BD (rápidas, antes de cualquier transacción)
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "El pedido debe tener al menos un producto" });
    }
    const metodosValidos = ["efectivo", "yape", "plin", "transferencia", "tarjeta"];
    if (!metodo_pago || !metodosValidos.includes(metodo_pago)) {
      return res.status(400).json({ error: "Método de pago no válido" });
    }
    // SDI-272: dirección de entrega obligatoria
    if (!dir_calle?.trim()) {
      return res.status(400).json({ error: "La dirección de entrega (calle y número) es obligatoria" });
    }
    if (!dir_distrito?.trim()) {
      return res.status(400).json({ error: "El distrito de entrega es obligatorio" });
    }
    if (dir_calle.length > 200 || (dir_referencia && dir_referencia.length > 200)) {
      return res.status(400).json({ error: "La dirección no puede superar 200 caracteres" });
    }
    for (const item of items) {
      if (!item.producto_id || !Number.isInteger(item.cantidad) || item.cantidad < 1) {
        return res.status(400).json({ error: "Item con producto_id o cantidad inválidos" });
      }
    }

    // Generar código único fuera de la transacción (evita contaminar el rollback)
    let codigo;
    for (let intentos = 0; intentos < 5; intentos++) {
      const candidato = generarCodigo();
      const [existe] = await conn.execute(
        "SELECT id FROM pedidos WHERE codigo_verificacion = ?", [candidato]
      );
      if (existe.length === 0) { codigo = candidato; break; }
    }
    if (!codigo) throw new Error("No se pudo generar código único");

    // ── INICIO DE TRANSACCIÓN ──────────────────────────────────────
    await conn.beginTransaction();

    // SELECT FOR UPDATE: bloquea las filas de productos para evitar
    // condiciones de carrera cuando dos pedidos concurrentes solicitan
    // el mismo producto con stock limitado.
    const itemsVerificados = [];
    for (const item of items) {
      const [rows] = await conn.execute(
        "SELECT id, nombre, precio, stock FROM productos WHERE id = ? AND estado = 'activo' FOR UPDATE",
        [item.producto_id]
      );
      if (rows.length === 0) {
        await conn.rollback();
        return res.status(400).json({ error: `Producto ${item.producto_id} no encontrado o inactivo` });
      }
      if (rows[0].stock < item.cantidad) {
        await conn.rollback();
        return res.status(400).json({ error: `Stock insuficiente para "${rows[0].nombre}"` });
      }
      itemsVerificados.push({
        producto_id: rows[0].id,
        nombre_producto: rows[0].nombre,
        precio_unitario: parseFloat(rows[0].precio),
        cantidad: item.cantidad,
        stock_actual: rows[0].stock,   // guardamos para el kardex sin 2ª consulta
      });
    }

    const subtotal = itemsVerificados.reduce((sum, i) => sum + i.precio_unitario * i.cantidad, 0);

    // Validar y aplicar cupón (dentro de la transacción para consistencia)
    let descuento = 0;
    let cuponAplicado = null;
    if (cupon_codigo) {
      const [[cupon]] = await conn.execute(
        "SELECT * FROM cupones WHERE codigo = ? AND activo = 1",
        [cupon_codigo.toUpperCase().trim()]
      );
      if (!cupon) { await conn.rollback(); return res.status(400).json({ error: "Cupón no válido o inactivo" }); }

      // SDI-269: verificar que este usuario no haya usado ya el cupón
      const [[usoExistente]] = await conn.execute(
        "SELECT id FROM cupon_usos WHERE cupon_id = ? AND usuario_id = ?",
        [cupon.id, usuarioId]
      );
      if (usoExistente) {
        await conn.rollback();
        return res.status(400).json({ error: "Ya utilizaste este cupón anteriormente" });
      }

      const { valido, error } = _validarLogica(cupon, subtotal);
      if (!valido) { await conn.rollback(); return res.status(400).json({ error }); }
      descuento = _calcularDescuento(cupon, subtotal);
      cuponAplicado = cupon;
    }

    const total = Math.max(0, subtotal - descuento);

    const [pedidoResult] = await conn.execute(
      `INSERT INTO pedidos
         (usuario_id, total, nota, metodo_pago, codigo_verificacion,
          cupon_codigo, descuento, dir_calle, dir_distrito, dir_referencia)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuarioId, total.toFixed(2), nota || null, metodo_pago, codigo,
        cuponAplicado ? cuponAplicado.codigo : null, descuento.toFixed(2),
        dir_calle.trim(), dir_distrito.trim(), dir_referencia?.trim() || null,
      ]
    );
    const pedidoId = pedidoResult.insertId;

    for (const item of itemsVerificados) {
      await conn.execute(
        "INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, nombre_producto) VALUES (?, ?, ?, ?, ?)",
        [pedidoId, item.producto_id, item.cantidad, item.precio_unitario, item.nombre_producto]
      );
      const stockNuevo = item.stock_actual - item.cantidad;
      await conn.execute("UPDATE productos SET stock = stock - ? WHERE id = ?", [item.cantidad, item.producto_id]);
      try {
        await registrarMovimiento(conn, {
          producto_id: item.producto_id, tipo: "pedido",
          cantidad: -item.cantidad, stock_anterior: item.stock_actual, stock_nuevo: stockNuevo,
          motivo: `Venta — Pedido #${pedidoId}`, pedido_id: pedidoId, usuario_id: usuarioId,
        });
      } catch (e) { console.warn("movimientos_inventario no disponible:", e.code); }
    }

    await conn.commit();

    // Registrar uso del cupón (SDI-269: cupon_usos garantiza 1 uso por usuario)
    if (cuponAplicado) {
      try {
        await pool.execute(
          "UPDATE cupones SET usos_totales = usos_totales + 1, usos_disponibles = IF(usos_disponibles IS NULL, NULL, usos_disponibles - 1) WHERE id = ?",
          [cuponAplicado.id]
        );
        await pool.execute(
          "INSERT IGNORE INTO cupon_usos (cupon_id, usuario_id, pedido_id) VALUES (?, ?, ?)",
          [cuponAplicado.id, usuarioId, pedidoId]
        );
      } catch (e) { console.warn("Error actualizando uso de cupón:", e.message); }
    }

    const [pedido] = await conn.execute(
      "SELECT p.*, u.nombre as cliente_nombre, u.email as cliente_email FROM pedidos p JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = ?",
      [pedidoId]
    );
    const [detalle] = await conn.execute(
      "SELECT * FROM detalle_pedidos WHERE pedido_id = ?",
      [pedidoId]
    );

    const pedidoCompleto = { ...pedido[0], items: detalle };

    // Emails y notificaciones no bloqueantes
    enviarConfirmacionPedido(pedido[0].cliente_nombre, pedido[0].cliente_email, pedidoCompleto)
      .catch((err) => console.error("Error enviando confirmación de pedido:", err));
    enviarNotificacionAdmin(pedidoCompleto)
      .catch((err) => console.error("Error enviando notificación admin:", err));
    const { titulo, mensaje } = MENSAJES.pedido_nuevo(pedidoId, total);
    crearNotificacion(usuarioId, "pedido_nuevo", titulo, mensaje, { pedido_id: pedidoId })
      .catch((err) => console.error("Error creando notificación:", err));

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

// Helper: agrupa filas de JOIN en { pedido: { items: [] } } — O(n), sin N+1
const agruparPedidosConItems = (rows) => {
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.id)) {
      const { item_id, item_producto_id, item_cantidad, item_precio, item_nombre,
              item_codigo, item_unidad, ...pedido } = row;
      map.set(row.id, { ...pedido, items: [] });
    }
    if (row.item_id) {
      map.get(row.id).items.push({
        id: row.item_id,
        producto_id: row.item_producto_id,
        cantidad: row.item_cantidad,
        precio_unitario: row.item_precio,
        nombre_producto: row.item_nombre,
        codigo_producto: row.item_codigo,
        unidad: row.item_unidad,
      });
    }
  }
  return [...map.values()];
};

export const getMisPedidos = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50,  parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    const [[{ total }]] = await pool.execute(
      "SELECT COUNT(*) AS total FROM pedidos WHERE usuario_id = ?",
      [usuarioId]
    );

    const [rows] = await pool.query(
      `SELECT
         p.*,
         dp.id          AS item_id,
         dp.producto_id AS item_producto_id,
         dp.cantidad    AS item_cantidad,
         dp.precio_unitario AS item_precio,
         dp.nombre_producto AS item_nombre,
         pr.codigo      AS item_codigo,
         pr.unidad      AS item_unidad
       FROM (
         SELECT * FROM pedidos WHERE usuario_id = ?
         ORDER BY creado_en DESC LIMIT ? OFFSET ?
       ) p
       LEFT JOIN detalle_pedidos dp ON dp.pedido_id = p.id
       LEFT JOIN productos pr ON pr.id = dp.producto_id
       ORDER BY p.creado_en DESC, dp.id`,
      [usuarioId, limit, offset]
    );

    res.json({
      success: true,
      data: agruparPedidosConItems(rows),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
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
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const estado = req.query.estado || null;

    const conditions = [];
    const params = [];
    if (estado) { conditions.push("p.estado = ?"); params.push(estado); }
    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM pedidos p ${where}`,
      params
    );

    // SDI-258 (H-13): LEFT JOIN a usuarios Y clientes — incluye pedidos B2B (mayoristas)
    // SDI-262 (H-06): un solo JOIN elimina el bucle N+1
    // SDI-265      : paginación con subquery para aplicar LIMIT antes del JOIN con items
    const [rows] = await pool.query(
      `SELECT
         p.*,
         COALESCE(u.nombre, c.contacto_nombre) AS cliente_nombre,
         COALESCE(u.email,  c.email)            AS cliente_email,
         CASE WHEN p.cliente_id IS NOT NULL THEN 'mayorista' ELSE u.rol END AS tipo_cliente,
         dp.id          AS item_id,
         dp.producto_id AS item_producto_id,
         dp.cantidad    AS item_cantidad,
         dp.precio_unitario AS item_precio,
         dp.nombre_producto AS item_nombre,
         pr.codigo      AS item_codigo,
         pr.unidad      AS item_unidad
       FROM (
         SELECT * FROM pedidos p ${where}
         ORDER BY creado_en DESC LIMIT ? OFFSET ?
       ) p
       LEFT JOIN usuarios u ON p.usuario_id = u.id
       LEFT JOIN clientes c ON p.cliente_id  = c.id
       LEFT JOIN detalle_pedidos dp ON dp.pedido_id = p.id
       LEFT JOIN productos pr ON pr.id = dp.producto_id
       ORDER BY p.creado_en DESC, dp.id`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: agruparPedidosConItems(rows),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
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

// conn opcional: si se pasa, las queries participan en la transacción del llamador.
const restaurarStock = async (pedidoId, tipo = "cancelacion", usuarioId = null, conn = null) => {
  const db = conn || pool;
  const [items] = await db.execute(
    "SELECT producto_id, cantidad FROM detalle_pedidos WHERE pedido_id = ?",
    [pedidoId]
  );
  for (const item of items) {
    const [[prod]] = await db.execute("SELECT stock FROM productos WHERE id = ?", [item.producto_id]);
    const stockAnterior = prod?.stock ?? 0;
    const stockNuevo = stockAnterior + item.cantidad;
    await db.execute("UPDATE productos SET stock = stock + ? WHERE id = ?", [item.cantidad, item.producto_id]);
    try {
      await db.execute(
        `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, pedido_id, usuario_id, motivo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.producto_id, tipo, item.cantidad, stockAnterior, stockNuevo, pedidoId, usuarioId,
         `Stock restaurado por ${tipo === "cancelacion" ? "cancelación" : "devolución"} del pedido #${pedidoId}`]
      );
    } catch (e) { console.warn("movimientos_inventario no disponible:", e.code); }
  }
};

export const cancelarPedidoCliente = async (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;
  const usuario_id = req.user.id;

  if (!motivo?.trim()) {
    return res.status(400).json({ error: "Debes indicar un motivo para cancelar el pedido" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [pedidos] = await conn.execute(
      "SELECT id, estado, usuario_id FROM pedidos WHERE id = ? AND usuario_id = ? FOR UPDATE",
      [id, usuario_id]
    );

    if (pedidos.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const pedido = pedidos[0];
    const cancelables = ["pendiente", "confirmado", "preparando"];

    if (!cancelables.includes(pedido.estado)) {
      await conn.rollback();
      const estadoLabel = {
        enviado: "En Camino", entregado: "Entregado", cancelado: "ya cancelado",
        devuelto: "en proceso de devolución",
        procesando: "En Preparación", completado: "Entregado",
      };
      return res.status(400).json({
        error: `No puedes cancelar este pedido porque está ${estadoLabel[pedido.estado] || pedido.estado}. Solo se pueden cancelar pedidos Pendientes, Confirmados o En Preparación.`,
      });
    }

    await restaurarStock(id, "cancelacion", usuario_id, conn);
    await conn.execute(
      "UPDATE pedidos SET estado = 'cancelado', motivo_cancelacion = ? WHERE id = ?",
      [motivo.trim(), id]
    );

    await conn.commit();
    res.json({ success: true, message: "Pedido cancelado. El stock fue restaurado." });
  } catch (err) {
    await conn.rollback();
    console.error("Error cancelarPedidoCliente:", err);
    res.status(500).json({ error: "Error al cancelar el pedido" });
  } finally {
    conn.release();
  }
};

// SDI-68: Transiciones válidas de estado
const TRANSICIONES = {
  pendiente:  ["confirmado", "cancelado"],
  confirmado: ["preparando", "cancelado"],
  preparando: ["enviado",    "cancelado"],
  enviado:    ["entregado",  "devuelto"],
  entregado:  ["devuelto"],
  cancelado:  [],
  devuelto:   [],
  // backward compat con estados legacy
  procesando: ["enviado", "cancelado"],
  completado: ["devuelto"],
};

export const updateEstadoPedido = async (req, res) => {
  const { id } = req.params;
  const { estado, motivo } = req.body;
  const ESTADOS_VALIDOS = ["pendiente", "confirmado", "preparando", "enviado", "entregado", "cancelado", "devuelto"];

  if (!ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({ error: "Estado no válido" });
  }
  if (["cancelado", "devuelto"].includes(estado) && !motivo?.trim()) {
    const accion = estado === "cancelado" ? "cancelar" : "registrar devolución de";
    return res.status(400).json({ error: `Debes indicar un motivo para ${accion} el pedido` });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.execute(
      "SELECT estado, usuario_id FROM pedidos WHERE id = ? FOR UPDATE",
      [id]
    );
    if (existing.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const estadoActual = existing[0].estado;
    const pedidoUsuarioId = existing[0].usuario_id;
    const permitidos = TRANSICIONES[estadoActual] ?? [];
    if (!permitidos.includes(estado)) {
      await conn.rollback();
      return res.status(400).json({
        error: `No se puede pasar de "${estadoActual}" a "${estado}". Transiciones válidas: ${permitidos.join(", ") || "ninguna"}`,
      });
    }

    const adminId = req.user?.id || null;
    if (estado === "cancelado") {
      await restaurarStock(id, "cancelacion", adminId, conn);
      await conn.execute(
        "UPDATE pedidos SET estado = 'cancelado', motivo_cancelacion = ? WHERE id = ?",
        [motivo.trim(), id]
      );
    } else if (estado === "devuelto") {
      await restaurarStock(id, "devolucion", adminId, conn);
      await conn.execute(
        "UPDATE pedidos SET estado = 'devuelto', motivo_cancelacion = ? WHERE id = ?",
        [motivo.trim(), id]
      );
    } else {
      await conn.execute("UPDATE pedidos SET estado = ? WHERE id = ?", [estado, id]);
    }

    await conn.commit();

    // Emails y notificaciones fuera de la transacción (no bloqueantes)
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
      }).catch((err) => console.error("Error enviando cambio de estado:", err));
    }

    if (pedidoUsuarioId) {
      const tipoMap = {
        confirmado: "pedido_confirmado", preparando: "pedido_preparando",
        enviado: "pedido_enviado", entregado: "pedido_entregado",
        cancelado: "pedido_cancelado", devuelto: "pedido_devuelto",
      };
      const tipo = tipoMap[estado];
      if (tipo && MENSAJES[tipo]) {
        const { titulo, mensaje } = MENSAJES[tipo](id, motivo);
        crearNotificacion(pedidoUsuarioId, tipo, titulo, mensaje, { pedido_id: parseInt(id) });
      }
    }

    res.json({ success: true, message: `Pedido actualizado a "${estado}"` });
  } catch (error) {
    await conn.rollback();
    console.error("Error actualizando estado:", error);
    res.status(500).json({ error: "Error del servidor" });
  } finally {
    conn.release();
  }
};
