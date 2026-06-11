import pool from "../config/database.js";

export const crearNotificacion = async (usuario_id, tipo, titulo, mensaje, datos = null) => {
  try {
    await pool.execute(
      "INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, datos) VALUES (?, ?, ?, ?, ?)",
      [usuario_id, tipo, titulo, mensaje || null, datos ? JSON.stringify(datos) : null]
    );
  } catch (e) {
    console.warn("Error creando notificación:", e.message);
  }
};

export const MENSAJES = {
  pedido_nuevo:      (id, total) => ({ titulo: `Pedido #${id} recibido`, mensaje: `Estamos procesando tu pedido por S/.${parseFloat(total).toFixed(2)}.` }),
  pedido_confirmado: (id)        => ({ titulo: `Pedido #${id} confirmado`, mensaje: "Tu pedido fue confirmado y está en cola de preparación." }),
  pedido_preparando: (id)        => ({ titulo: `Pedido #${id} en preparación`, mensaje: "Estamos empacando tu pedido." }),
  pedido_enviado:    (id)        => ({ titulo: `Pedido #${id} en camino`, mensaje: "Tu pedido salió para entrega. ¡Pronto llegará!" }),
  pedido_entregado:  (id)        => ({ titulo: `Pedido #${id} entregado`, mensaje: "¡Tu pedido llegó! Puedes valorar los productos." }),
  pedido_cancelado:  (id, motivo)=> ({ titulo: `Pedido #${id} cancelado`, mensaje: motivo ? `Motivo: ${motivo}` : "Tu pedido fue cancelado." }),
  pedido_devuelto:   (id, motivo)=> ({ titulo: `Pedido #${id} en devolución`, mensaje: motivo ? `Motivo: ${motivo}` : "Tu pedido está en proceso de devolución." }),
  pago_verificado:   (id)        => ({ titulo: "Pago verificado ✓", mensaje: `Tu pago del pedido #${id} fue verificado y confirmado.` }),
  pago_rechazado:    (id, motivo)=> ({ titulo: "Pago rechazado", mensaje: `Tu pago del pedido #${id} fue rechazado. ${motivo ? `Motivo: ${motivo}` : ""}`.trim() }),
};
