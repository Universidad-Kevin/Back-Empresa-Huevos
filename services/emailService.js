import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FROM = `"CampOrganic" <${process.env.EMAIL_USER}>`;

const emailHabilitado = () => !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS;

const enviar = async (to, subject, html) => {
  if (!emailHabilitado()) {
    console.log(`[Email deshabilitado] Para: ${to} | Asunto: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    console.log(`Email enviado a ${to}: ${subject}`);
  } catch (err) {
    console.error(`Error enviando email a ${to}:`, err.message);
  }
};

export const enviarBienvenida = (nombre, email) =>
  enviar(
    email,
    "¡Bienvenido a CampOrganic!",
    `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;">
      <div style="background:#2D5A27;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;">CampOrganic</h1>
      </div>
      <div style="padding:32px;background:#f9f9f9;">
        <h2 style="color:#2D5A27;">¡Hola, ${nombre}!</h2>
        <p>Tu cuenta ha sido creada exitosamente. Ya puedes explorar nuestros productos orgánicos frescos y realizar tus primeras compras.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/productos"
             style="background:#2D5A27;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Ver Productos
          </a>
        </div>
        <p style="color:#888;font-size:13px;">Si no creaste esta cuenta, ignora este correo.</p>
      </div>
    </div>
    `
  );

export const enviarConfirmacionPedido = (nombre, email, pedido) => {
  const metodoPagoLabel = {
    efectivo: "💵 Pago contra entrega",
    transferencia: "🏦 Transferencia bancaria",
    tarjeta: "💳 Tarjeta de crédito/débito",
  };

  const itemsHTML = (pedido.items || [])
    .map(
      (i) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${i.nombre_producto}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.cantidad}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${parseFloat(i.precio_unitario).toFixed(2)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${(i.cantidad * i.precio_unitario).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  return enviar(
    email,
    `Pedido #${pedido.id} confirmado — CampOrganic`,
    `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;">
      <div style="background:#2D5A27;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;">CampOrganic</h1>
      </div>
      <div style="padding:32px;background:#f9f9f9;">
        <h2 style="color:#2D5A27;">¡Pedido confirmado, ${nombre}!</h2>
        <p>Tu pedido <strong>#${pedido.id}</strong> fue recibido y está siendo procesado.</p>

        <table style="width:100%;border-collapse:collapse;margin:24px 0;">
          <thead>
            <tr style="background:#2D5A27;color:#fff;">
              <th style="padding:10px;text-align:left;">Producto</th>
              <th style="padding:10px;text-align:center;">Cant.</th>
              <th style="padding:10px;text-align:right;">Precio</th>
              <th style="padding:10px;text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding:12px;text-align:right;font-weight:bold;">Total:</td>
              <td style="padding:12px;text-align:right;font-weight:bold;color:#2D5A27;">$${parseFloat(pedido.total).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <p><strong>Método de pago:</strong> ${metodoPagoLabel[pedido.metodo_pago] || pedido.metodo_pago}</p>
        ${pedido.metodo_pago === "transferencia"
          ? `<div style="background:#e8f4fd;padding:16px;border-radius:8px;margin-top:12px;">
               <strong>Datos bancarios:</strong><br/>
               Banco: ${process.env.BANCO_NOMBRE || "—"}<br/>
               Cuenta: ${process.env.BANCO_CUENTA || "—"}<br/>
               Titular: ${process.env.BANCO_TITULAR || "—"}<br/>
               <small>Tienes 48 horas para realizar la transferencia.</small>
             </div>`
          : ""}

        <div style="text-align:center;margin:32px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/mis-pedidos/${pedido.id}"
             style="background:#2D5A27;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Ver mi pedido
          </a>
        </div>
      </div>
    </div>
    `
  );
};

export const enviarNotificacionAdmin = (pedido) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  if (!adminEmail) return;

  const metodoPagoLabel = {
    efectivo: "💵 Pago contra entrega",
    transferencia: "🏦 Transferencia bancaria",
    tarjeta: "💳 Tarjeta de crédito/débito",
  };

  const itemsHTML = (pedido.items || [])
    .map(
      (i) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${i.nombre_producto}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.cantidad}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${parseFloat(i.precio_unitario).toFixed(2)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${(i.cantidad * i.precio_unitario).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  return enviar(
    adminEmail,
    `🛒 Nuevo pedido #${pedido.id} de ${pedido.cliente_nombre}`,
    `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;">
      <div style="background:#1a3a6b;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;">CampOrganic — Admin</h1>
      </div>
      <div style="padding:32px;background:#f9f9f9;">
        <h2 style="color:#1a3a6b;">Nuevo pedido recibido</h2>
        <p>El cliente <strong>${pedido.cliente_nombre}</strong> (${pedido.cliente_email}) acaba de realizar un pedido.</p>

        <div style="background:#fff;border:1px solid #ddd;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:4px 0;"><strong>Pedido #:</strong> ${pedido.id}</p>
          <p style="margin:4px 0;"><strong>Total:</strong> $${parseFloat(pedido.total).toFixed(2)}</p>
          <p style="margin:4px 0;"><strong>Método de pago:</strong> ${metodoPagoLabel[pedido.metodo_pago] || pedido.metodo_pago}</p>
          <p style="margin:4px 0;"><strong>Estado:</strong> Pendiente</p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <thead>
            <tr style="background:#1a3a6b;color:#fff;">
              <th style="padding:10px;text-align:left;">Producto</th>
              <th style="padding:10px;text-align:center;">Cant.</th>
              <th style="padding:10px;text-align:right;">Precio</th>
              <th style="padding:10px;text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding:12px;text-align:right;font-weight:bold;">Total:</td>
              <td style="padding:12px;text-align:right;font-weight:bold;color:#1a3a6b;">$${parseFloat(pedido.total).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <div style="text-align:center;margin:32px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/pedidos"
             style="background:#1a3a6b;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Gestionar Pedidos
          </a>
        </div>
      </div>
    </div>
    `
  );
};

export const enviarCambioEstado = (nombre, email, pedido) => {
  const mensajes = {
    procesando: { titulo: "Tu pedido está en proceso", desc: "Estamos preparando tu pedido con cuidado." },
    enviado:    { titulo: "Tu pedido fue enviado", desc: "Tu pedido está en camino. Llegará pronto." },
    completado: { titulo: "Pedido entregado", desc: "¡Esperamos que disfrutes tu compra!" },
    cancelado:  { titulo: "Pedido cancelado", desc: "Tu pedido fue cancelado. Contáctanos si tienes dudas." },
  };

  const info = mensajes[pedido.estado] || { titulo: `Estado: ${pedido.estado}`, desc: "" };

  return enviar(
    email,
    `${info.titulo} — Pedido #${pedido.id}`,
    `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;">
      <div style="background:#2D5A27;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;">CampOrganic</h1>
      </div>
      <div style="padding:32px;background:#f9f9f9;">
        <h2 style="color:#2D5A27;">${info.titulo}</h2>
        <p>Hola <strong>${nombre}</strong>, ${info.desc}</p>
        <p>Tu pedido <strong>#${pedido.id}</strong> ahora está en estado: <strong>${pedido.estado}</strong>.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/mis-pedidos/${pedido.id}"
             style="background:#2D5A27;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Ver mi pedido
          </a>
        </div>
      </div>
    </div>
    `
  );
};
