import pool from "../config/database.js";
import { crearNotificacion, MENSAJES } from "../services/notificacionesService.js";
import { crearCargo } from "../services/culqiService.js";


// POST /pagos — Cliente registra/actualiza comprobante
export const registrarPago = async (req, res) => {
  try {
    const { pedido_id, voucher } = req.body;
    const usuarioId = req.user.id;

    if (!pedido_id) return res.status(400).json({ error: "pedido_id es requerido" });

    const [pedidos] = await pool.execute(
      "SELECT id, total, metodo_pago, estado, usuario_id FROM pedidos WHERE id = ?",
      [pedido_id]
    );
    if (pedidos.length === 0) return res.status(404).json({ error: "Pedido no encontrado" });

    const pedido = pedidos[0];
    if (pedido.usuario_id !== usuarioId && req.user.rol !== "admin") {
      return res.status(403).json({ error: "Sin permiso" });
    }
    if (pedido.estado === "cancelado") {
      return res.status(400).json({ error: "No puedes registrar pago de un pedido cancelado" });
    }

    const [existing] = await pool.execute("SELECT id FROM pagos WHERE pedido_id = ?", [pedido_id]);

    if (existing.length > 0) {
      await pool.execute(
        "UPDATE pagos SET voucher = ?, estado = 'pendiente', actualizado_en = NOW() WHERE pedido_id = ?",
        [voucher || null, pedido_id]
      );
    } else {
      await pool.execute(
        "INSERT INTO pagos (pedido_id, metodo, monto, voucher) VALUES (?, ?, ?, ?)",
        [pedido_id, pedido.metodo_pago, pedido.total, voucher || null]
      );
    }

    const [[pago]] = await pool.execute("SELECT id, pedido_id, metodo, estado, monto, notas_admin, creado_en FROM pagos WHERE pedido_id = ?", [pedido_id]);
    res.json({ success: true, data: pago, message: "Comprobante registrado correctamente" });
  } catch (error) {
    console.error("Error registrando pago:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// GET /pagos — Admin lista todos los pagos (sin voucher para aligerar la respuesta)
export const getAllPagos = async (req, res) => {
  try {
    if (req.user.rol !== "admin") return res.status(403).json({ error: "Solo admin" });

    const [pagos] = await pool.execute(`
      SELECT pg.id, pg.pedido_id, pg.metodo, pg.estado, pg.monto,
             pg.notas_admin, pg.creado_en, pg.actualizado_en,
             IF(pg.voucher IS NOT NULL, 1, 0) AS tiene_voucher,
             p.codigo_verificacion,
             COALESCE(u.nombre, c.contacto_nombre) AS cliente_nombre,
             COALESCE(u.email, c.email) AS cliente_email
      FROM pagos pg
      JOIN pedidos p ON pg.pedido_id = p.id
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN clientes c ON p.cliente_id = c.id
      ORDER BY pg.creado_en DESC
    `);
    res.json({ success: true, data: pagos });
  } catch (error) {
    console.error("Error listando pagos:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// GET /pagos/pedido/:pedido_id — Obtener pago de un pedido (con voucher)
export const getPagoPorPedido = async (req, res) => {
  try {
    const { pedido_id } = req.params;
    const [[pedido]] = await pool.execute("SELECT usuario_id FROM pedidos WHERE id = ?", [pedido_id]);
    if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });
    if (pedido.usuario_id !== req.user.id && req.user.rol !== "admin") {
      return res.status(403).json({ error: "Sin permiso" });
    }
    const [pagos] = await pool.execute("SELECT * FROM pagos WHERE pedido_id = ?", [pedido_id]);
    if (pagos.length === 0) return res.status(404).json({ error: "Sin pago registrado para este pedido" });
    res.json({ success: true, data: pagos[0] });
  } catch (error) {
    res.status(500).json({ error: "Error del servidor" });
  }
};

// GET /pagos/:id/voucher — Admin obtiene imagen del voucher
export const getVoucher = async (req, res) => {
  try {
    if (req.user.rol !== "admin") return res.status(403).json({ error: "Solo admin" });
    const { id } = req.params;
    const [[pago]] = await pool.execute("SELECT voucher FROM pagos WHERE id = ?", [id]);
    if (!pago) return res.status(404).json({ error: "Pago no encontrado" });
    if (!pago.voucher) return res.status(404).json({ error: "Este pago no tiene comprobante" });
    res.json({ success: true, data: { voucher: pago.voucher } });
  } catch (error) {
    res.status(500).json({ error: "Error del servidor" });
  }
};

// PATCH /pagos/:id/verificar — Admin verifica pago → confirma pedido automáticamente
export const verificarPago = async (req, res) => {
  try {
    if (req.user.rol !== "admin") return res.status(403).json({ error: "Solo admin" });
    const { id } = req.params;
    const { notas_admin } = req.body;

    const [[pago]] = await pool.execute("SELECT * FROM pagos WHERE id = ?", [id]);
    if (!pago) return res.status(404).json({ error: "Pago no encontrado" });
    if (pago.estado !== "pendiente") {
      return res.status(400).json({ error: `El pago ya está en estado "${pago.estado}"` });
    }

    await pool.execute(
      "UPDATE pagos SET estado = 'verificado', notas_admin = ?, actualizado_en = NOW() WHERE id = ?",
      [notas_admin || null, id]
    );
    await pool.execute("UPDATE pedidos SET estado_pago = 'pagado' WHERE id = ?", [pago.pedido_id]);

    const [[pedidoActual]] = await pool.execute("SELECT estado FROM pedidos WHERE id = ?", [pago.pedido_id]);
    if (pedidoActual?.estado === "pendiente") {
      await pool.execute("UPDATE pedidos SET estado = 'confirmado' WHERE id = ?", [pago.pedido_id]);
    }

    const [[ped]] = await pool.execute("SELECT usuario_id FROM pedidos WHERE id = ?", [pago.pedido_id]);
    if (ped?.usuario_id) {
      const { titulo, mensaje } = MENSAJES.pago_verificado(pago.pedido_id);
      crearNotificacion(ped.usuario_id, "pago_verificado", titulo, mensaje, { pedido_id: pago.pedido_id });
    }

    res.json({ success: true, message: "Pago verificado. El pedido fue confirmado automáticamente." });
  } catch (error) {
    console.error("Error verificando pago:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// PATCH /pagos/:id/rechazar — Admin rechaza pago
export const rechazarPago = async (req, res) => {
  try {
    if (req.user.rol !== "admin") return res.status(403).json({ error: "Solo admin" });
    const { id } = req.params;
    const { notas_admin } = req.body;

    if (!notas_admin?.trim()) {
      return res.status(400).json({ error: "Debes indicar el motivo del rechazo" });
    }

    const [[pago]] = await pool.execute("SELECT estado, pedido_id FROM pagos WHERE id = ?", [id]);
    if (!pago) return res.status(404).json({ error: "Pago no encontrado" });
    if (pago.estado !== "pendiente") {
      return res.status(400).json({ error: `El pago ya está en estado "${pago.estado}"` });
    }

    await pool.execute(
      "UPDATE pagos SET estado = 'rechazado', notas_admin = ?, actualizado_en = NOW() WHERE id = ?",
      [notas_admin.trim(), id]
    );

    const [[ped]] = await pool.execute("SELECT usuario_id FROM pedidos WHERE id = ?", [pago.pedido_id]);
    if (ped?.usuario_id) {
      const { titulo, mensaje } = MENSAJES.pago_rechazado(pago.pedido_id, notas_admin.trim());
      crearNotificacion(ped.usuario_id, "pago_rechazado", titulo, mensaje, { pedido_id: pago.pedido_id });
    }

    res.json({ success: true, message: "Pago rechazado." });
  } catch (error) {
    console.error("Error rechazando pago:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// POST /pagos/culqi/cargo — Pago con tarjeta vía Culqi
export const procesarPagoCulqi = async (req, res) => {
  const { pedido_id, culqi_token } = req.body;
  if (!pedido_id || !culqi_token) {
    return res.status(400).json({ error: "pedido_id y culqi_token son requeridos" });
  }

  try {
    const [[pedido]] = await pool.execute(
      "SELECT id, total, estado, estado_pago, usuario_id FROM pedidos WHERE id = ?",
      [pedido_id]
    );
    if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });
    if (pedido.usuario_id !== req.user.id) return res.status(403).json({ error: "Sin permiso" });
    if (pedido.estado_pago === "pagado") return res.status(400).json({ error: "El pedido ya está pagado" });
    if (pedido.estado === "cancelado") return res.status(400).json({ error: "Pedido cancelado" });

    const amountCentavos = Math.round(parseFloat(pedido.total) * 100);

    const cargo = await crearCargo({
      amount: amountCentavos,
      email: req.user.email,
      sourceId: culqi_token,
      description: `Pedido #${pedido_id} — CampOrganic`,
    });

    // Registrar pago y marcar pedido
    const [existing] = await pool.execute("SELECT id FROM pagos WHERE pedido_id = ?", [pedido_id]);
    const notas = `Culqi charge_id: ${cargo.id}`;
    if (existing.length > 0) {
      await pool.execute(
        "UPDATE pagos SET estado = 'verificado', notas_admin = ?, actualizado_en = NOW() WHERE pedido_id = ?",
        [notas, pedido_id]
      );
    } else {
      await pool.execute(
        "INSERT INTO pagos (pedido_id, metodo, monto, estado, notas_admin) VALUES (?, 'tarjeta', ?, 'verificado', ?)",
        [pedido_id, pedido.total, notas]
      );
    }

    await pool.execute("UPDATE pedidos SET estado_pago = 'pagado', estado = 'confirmado' WHERE id = ?", [pedido_id]);

    const { titulo, mensaje } = MENSAJES.pago_verificado(pedido_id);
    crearNotificacion(req.user.id, "pago_verificado", titulo, mensaje, { pedido_id });

    res.json({ success: true, charge_id: cargo.id, message: "Pago procesado correctamente" });
  } catch (err) {
    const culqiErr = err.body?.user_message || err.body?.merchant_message || err.message || "Error al procesar pago";
    console.error("Culqi error:", err);
    res.status(402).json({ error: culqiErr });
  }
};
