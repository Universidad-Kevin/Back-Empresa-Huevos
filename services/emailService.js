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

export const enviarContactoMayorista = (cliente, datos) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  if (!adminEmail) return;

  const { asunto, mensaje } = datos;

  return enviar(
    adminEmail,
    `📩 [Mayorista] ${cliente.nombre_empresa}: ${asunto}`,
    `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
      <div style="background:#2D5A27;padding:24px 32px;">
        <h1 style="color:#fff;margin:0;">🌿 CampOrganic</h1>
        <p style="color:#c8e6c9;margin:4px 0 0;">Mensaje de cliente mayorista</p>
      </div>
      <div style="padding:32px;background:#f9f9f9;">
        <h2 style="color:#2D5A27;margin-top:0;">Nuevo mensaje recibido</h2>

        <div style="background:#fff;border:1px solid #ddd;border-radius:8px;padding:20px;margin-bottom:20px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;color:#666;width:130px;">Empresa</td>
              <td style="padding:8px 0;font-weight:bold;">${cliente.nombre_empresa}</td>
            </tr>
            <tr style="border-top:1px solid #f0f0f0;">
              <td style="padding:8px 0;color:#666;">Contacto</td>
              <td style="padding:8px 0;">${cliente.contacto_nombre}</td>
            </tr>
            <tr style="border-top:1px solid #f0f0f0;">
              <td style="padding:8px 0;color:#666;">Email</td>
              <td style="padding:8px 0;"><a href="mailto:${cliente.email}" style="color:#2D5A27;">${cliente.email}</a></td>
            </tr>
            <tr style="border-top:1px solid #f0f0f0;">
              <td style="padding:8px 0;color:#666;">Teléfono</td>
              <td style="padding:8px 0;">${cliente.telefono || '—'}</td>
            </tr>
            <tr style="border-top:1px solid #f0f0f0;">
              <td style="padding:8px 0;color:#666;">Asunto</td>
              <td style="padding:8px 0;"><strong>${asunto}</strong></td>
            </tr>
          </table>
        </div>

        <div style="background:#fff;border:1px solid #ddd;border-radius:8px;padding:20px;">
          <p style="margin:0 0 8px;color:#666;font-size:13px;">MENSAJE</p>
          <p style="margin:0;white-space:pre-line;line-height:1.6;">${mensaje}</p>
        </div>

        <div style="text-align:center;margin:28px 0 0;">
          <a href="mailto:${cliente.email}?subject=Re: ${asunto}"
             style="background:#2D5A27;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Responder al cliente
          </a>
        </div>
      </div>
      <div style="padding:16px 32px;background:#f0f0f0;text-align:center;font-size:12px;color:#999;">
        Mensaje desde el portal mayorista de CampOrganic
      </div>
    </div>
    `
  );
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
    yape: "📱 Yape",
    plin: "💜 Plin",
    transferencia: "🏦 Transferencia bancaria",
    tarjeta: "💳 Tarjeta de crédito/débito",
  };

  const fecha = new Date(pedido.creado_en || Date.now()).toLocaleDateString("es-PE", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const itemsHTML = (pedido.items || [])
    .map((i) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;font-family:monospace;font-size:12px;color:#666;">
          ${i.codigo_producto || "—"}
        </td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${i.nombre_producto}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">
          ${i.cantidad} ${i.unidad || "uds."}
        </td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">
          S/.${parseFloat(i.precio_unitario).toFixed(2)}
        </td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;">
          S/.${(i.cantidad * i.precio_unitario).toFixed(2)}
        </td>
      </tr>`)
    .join("");

  return enviar(
    email,
    `Recibo Pedido #${pedido.id} — CampOrganic`,
    `
    <div style="font-family:sans-serif;max-width:640px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
      <!-- Encabezado -->
      <div style="background:#2D5A27;padding:24px 32px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h1 style="color:#fff;margin:0;font-size:24px;">🌿 CampOrganic</h1>
          <p style="color:#c8e6c9;margin:4px 0 0;font-size:13px;">${process.env.EMAIL_USER || "camporganic@gmail.com"}</p>
        </div>
        <div style="text-align:right;">
          <p style="color:#fff;margin:0;font-size:18px;font-weight:bold;">RECIBO #${pedido.id}</p>
          <p style="color:#c8e6c9;margin:4px 0 0;font-size:13px;">${fecha}</p>
        </div>
      </div>

      <!-- Datos del cliente -->
      <div style="padding:20px 32px;background:#f0f7f0;border-bottom:1px solid #ddd;">
        <p style="margin:0;font-size:13px;color:#666;">CLIENTE</p>
        <p style="margin:4px 0 0;font-weight:bold;font-size:15px;">${nombre}</p>
        <p style="margin:2px 0 0;color:#555;font-size:13px;">${email}</p>
      </div>

      <!-- Tabla de productos -->
      <div style="padding:24px 32px;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#2D5A27;color:#fff;">
              <th style="padding:10px 8px;text-align:left;font-size:12px;">CÓD.</th>
              <th style="padding:10px 8px;text-align:left;font-size:12px;">PRODUCTO</th>
              <th style="padding:10px 8px;text-align:center;font-size:12px;">CANT.</th>
              <th style="padding:10px 8px;text-align:right;font-size:12px;">P. UNIT.</th>
              <th style="padding:10px 8px;text-align:right;font-size:12px;">SUBTOTAL</th>
            </tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="padding:8px;text-align:right;color:#666;font-size:13px;">Envío:</td>
              <td style="padding:8px;text-align:right;color:#2D5A27;font-size:13px;">Gratis</td>
            </tr>
            <tr style="border-top:2px solid #2D5A27;">
              <td colspan="4" style="padding:12px 8px;text-align:right;font-weight:bold;font-size:16px;">TOTAL:</td>
              <td style="padding:12px 8px;text-align:right;font-weight:bold;font-size:16px;color:#2D5A27;">
                S/.${parseFloat(pedido.total).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Dirección de entrega -->
      ${pedido.dir_calle ? `
      <div style="padding:0 32px 16px;">
        <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:16px;">
          <p style="margin:0 0 4px;font-size:13px;color:#666;">📍 DIRECCIÓN DE ENTREGA</p>
          <p style="margin:2px 0;font-weight:bold;">${pedido.dir_calle}</p>
          <p style="margin:2px 0;">Distrito: ${pedido.dir_distrito || '—'}</p>
          ${pedido.dir_referencia ? `<p style="margin:2px 0;color:#666;font-size:13px;">Referencia: ${pedido.dir_referencia}</p>` : ''}
        </div>
      </div>` : ''}

      <!-- Info de pago -->
      <div style="padding:0 32px 24px;">
        <div style="background:#f9f9f9;border:1px solid #eee;border-radius:6px;padding:16px;">
          <p style="margin:0 0 8px;"><strong>Método de pago:</strong> ${metodoPagoLabel[pedido.metodo_pago] || pedido.metodo_pago}</p>
          ${pedido.metodo_pago === "transferencia"
            ? `<div style="background:#e8f4fd;padding:12px;border-radius:6px;margin-top:8px;font-size:13px;">
                 <strong>Datos para transferencia:</strong><br/>
                 Banco: ${process.env.BANCO_NOMBRE || "—"} &nbsp;|&nbsp;
                 Cuenta: ${process.env.BANCO_CUENTA || "—"} &nbsp;|&nbsp;
                 Titular: ${process.env.BANCO_TITULAR || "—"}<br/>
                 <em style="color:#666;">Tienes 48 horas para realizar la transferencia.</em>
               </div>`
            : ""}
          ${pedido.codigo_verificacion
            ? `<p style="margin:12px 0 0;">
                 <strong>Código de verificación:</strong>
                 <span style="font-family:monospace;font-size:18px;color:#2D5A27;letter-spacing:0.3rem;margin-left:8px;">
                   ${pedido.codigo_verificacion}
                 </span>
               </p>`
            : ""}
        </div>
      </div>

      <!-- Botón -->
      <div style="text-align:center;padding:0 32px 32px;">
        <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/mis-pedidos/${pedido.id}"
           style="background:#2D5A27;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
          Ver pedido en línea
        </a>
      </div>

      <!-- Footer -->
      <div style="padding:16px 32px;background:#f0f0f0;text-align:center;font-size:12px;color:#999;">
        CampOrganic &nbsp;·&nbsp; Productos orgánicos frescos &nbsp;·&nbsp; ${process.env.EMAIL_USER || "camporganic@gmail.com"}
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
    yape: "📱 Yape",
    plin: "💜 Plin",
    transferencia: "🏦 Transferencia bancaria",
    tarjeta: "💳 Tarjeta de crédito/débito",
  };

  const itemsHTML = (pedido.items || [])
    .map(
      (i) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${i.nombre_producto}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.cantidad}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">S/.${parseFloat(i.precio_unitario).toFixed(2)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">S/.${(i.cantidad * i.precio_unitario).toFixed(2)}</td>
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
          <p style="margin:4px 0;"><strong>Total:</strong> S/.${parseFloat(pedido.total).toFixed(2)}</p>
          <p style="margin:4px 0;"><strong>Método de pago:</strong> ${metodoPagoLabel[pedido.metodo_pago] || pedido.metodo_pago}</p>
          <p style="margin:4px 0;"><strong>Estado:</strong> Pendiente</p>
          ${pedido.dir_calle ? `<p style="margin:8px 0 4px;"><strong>📍 Entrega en:</strong> ${pedido.dir_calle}, ${pedido.dir_distrito}${pedido.dir_referencia ? ` (${pedido.dir_referencia})` : ''}</p>` : ''}
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
              <td style="padding:12px;text-align:right;font-weight:bold;color:#1a3a6b;">S/.${parseFloat(pedido.total).toFixed(2)}</td>
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

export const enviarMensajeContacto = (datos) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  if (!adminEmail) return;

  const { nombre, email, telefono, asunto, mensaje } = datos;

  return enviar(
    adminEmail,
    `📩 Nuevo mensaje de contacto: ${asunto}`,
    `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;">
      <div style="background:#2D5A27;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;">CampOrganic</h1>
        <p style="color:#c8e6c9;margin:4px 0 0;">Formulario de Contacto</p>
      </div>
      <div style="padding:32px;background:#f9f9f9;">
        <h2 style="color:#2D5A27;margin-top:0;">Nuevo mensaje recibido</h2>

        <div style="background:#fff;border:1px solid #ddd;border-radius:8px;padding:20px;margin-bottom:20px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;color:#666;width:120px;">Nombre</td>
              <td style="padding:8px 0;font-weight:bold;">${nombre}</td>
            </tr>
            <tr style="border-top:1px solid #f0f0f0;">
              <td style="padding:8px 0;color:#666;">Email</td>
              <td style="padding:8px 0;"><a href="mailto:${email}" style="color:#2D5A27;">${email}</a></td>
            </tr>
            <tr style="border-top:1px solid #f0f0f0;">
              <td style="padding:8px 0;color:#666;">Teléfono</td>
              <td style="padding:8px 0;">${telefono || '—'}</td>
            </tr>
            <tr style="border-top:1px solid #f0f0f0;">
              <td style="padding:8px 0;color:#666;">Asunto</td>
              <td style="padding:8px 0;"><strong>${asunto}</strong></td>
            </tr>
          </table>
        </div>

        <div style="background:#fff;border:1px solid #ddd;border-radius:8px;padding:20px;">
          <p style="margin:0 0 8px;color:#666;font-size:13px;">MENSAJE</p>
          <p style="margin:0;white-space:pre-line;line-height:1.6;">${mensaje}</p>
        </div>

        <div style="text-align:center;margin:28px 0 0;">
          <a href="mailto:${email}?subject=Re: ${asunto}"
             style="background:#2D5A27;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Responder al cliente
          </a>
        </div>
      </div>
      <div style="padding:16px;text-align:center;color:#999;font-size:12px;">
        Mensaje enviado desde el formulario de contacto de CampOrganic
      </div>
    </div>
    `
  );
};

export const enviarBienvenidaMayorista = (contacto, empresa, email, passwordPlain) =>
  enviar(
    email,
    `Bienvenido al portal mayorista — CampOrganic`,
    `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
      <div style="background:#2D5A27;padding:24px 32px;">
        <h1 style="color:#fff;margin:0;">🌿 CampOrganic</h1>
        <p style="color:#c8e6c9;margin:4px 0 0;">Portal Mayorista</p>
      </div>
      <div style="padding:32px;background:#f9f9f9;">
        <h2 style="color:#2D5A27;margin-top:0;">¡Bienvenido, ${contacto}!</h2>
        <p>Tu empresa <strong>${empresa}</strong> ya tiene acceso al portal mayorista de CampOrganic.</p>
        <p>Desde el portal podrás ver todos tus pedidos, su estado, el detalle de cada uno y contactarnos directamente.</p>

        <div style="background:#fff;border:1px solid #ddd;border-radius:6px;padding:20px;margin:24px 0;">
          <p style="margin:0 0 8px;color:#666;font-size:13px;">TUS CREDENCIALES DE ACCESO</p>
          <p style="margin:4px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin:4px 0;"><strong>Contraseña:</strong>
            <span style="font-family:monospace;background:#f0f0f0;padding:2px 8px;border-radius:4px;">${passwordPlain}</span>
          </p>
          <p style="margin:12px 0 0;font-size:12px;color:#999;">Por seguridad, te recomendamos cambiar tu contraseña en tu primer acceso.</p>
        </div>

        <div style="text-align:center;margin:28px 0;">
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/mayorista"
             style="background:#2D5A27;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
            Acceder al Portal
          </a>
        </div>
      </div>
      <div style="padding:16px 32px;background:#f0f0f0;text-align:center;font-size:12px;color:#999;">
        CampOrganic · ${process.env.EMAIL_USER || "camporganic@gmail.com"}
      </div>
    </div>
    `
  );

export const enviarAlertaStockBajo = (producto) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  if (!adminEmail) return Promise.resolve();
  return enviar(
    adminEmail,
    `⚠️ Stock bajo: ${producto.nombre} (${producto.stock} ${producto.unidad || "uds."})`,
    `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
      <div style="background:#dc3545;padding:24px 32px;">
        <h1 style="color:#fff;margin:0;">⚠️ Alerta de Stock Bajo</h1>
        <p style="color:#f8d7da;margin:4px 0 0;">CampOrganic · Inventario</p>
      </div>
      <div style="padding:32px;background:#f9f9f9;">
        <h2 style="color:#dc3545;margin-top:0;">El stock de un producto está por debajo del mínimo</h2>
        <div style="background:#fff;border:2px solid #dc3545;border-radius:8px;padding:20px;margin:16px 0;">
          <p style="margin:4px 0;font-size:18px;font-weight:bold;">${producto.nombre}</p>
          ${producto.codigo ? `<p style="margin:4px 0;color:#666;font-size:13px;">SKU: ${producto.codigo}</p>` : ""}
          <p style="margin:12px 0 4px;">Stock actual:
            <strong style="color:#dc3545;font-size:20px;">${producto.stock}</strong> ${producto.unidad || "unidades"}
          </p>
          <p style="margin:4px 0;color:#666;">Mínimo configurado: ${producto.stock_minimo} ${producto.unidad || "unidades"}</p>
        </div>
        <p>Se recomienda realizar una entrada de inventario lo antes posible para evitar quiebres de stock.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/admin/inventario"
             style="background:#dc3545;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Gestionar Inventario
          </a>
        </div>
      </div>
      <div style="padding:16px 32px;background:#f0f0f0;text-align:center;font-size:12px;color:#999;">
        CampOrganic · Esta alerta no se repetirá por las próximas 24 horas para el mismo producto
      </div>
    </div>
    `
  );
};

export const enviarFactura = async (nombre, email, factura, pdfBuffer) => {
  if (!emailHabilitado()) {
    console.log(`[Email deshabilitado] Factura ${factura.numero} para ${email}`);
    return;
  }
  const tipoLabel = factura.tipo === 'factura' ? 'Factura' : 'Boleta de Venta';
  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: `${tipoLabel} ${factura.numero} — CampOrganic`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
          <div style="background:#2D5A27;padding:24px 32px;">
            <h1 style="color:#fff;margin:0;">🌿 CampOrganic</h1>
            <p style="color:#c8e6c9;margin:4px 0 0;">Comprobante de pago</p>
          </div>
          <div style="padding:32px;background:#f9f9f9;">
            <h2 style="color:#2D5A27;margin-top:0;">Hola, ${nombre}</h2>
            <p>Adjuntamos tu <strong>${tipoLabel}</strong> por la compra realizada en CampOrganic.</p>
            <div style="background:#fff;border:1px solid #ddd;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="margin:4px 0;"><strong>Número:</strong> ${factura.numero}</p>
              <p style="margin:4px 0;"><strong>Total:</strong> S/.${parseFloat(factura.total).toFixed(2)}</p>
              <p style="margin:4px 0;"><strong>Pedido #:</strong> ${factura.pedido_id}</p>
            </div>
            <p style="color:#666;font-size:13px;">El comprobante se adjunta en formato PDF. Consérvalo para cualquier consulta.</p>
          </div>
          <div style="padding:16px 32px;background:#f0f0f0;text-align:center;font-size:12px;color:#999;">
            CampOrganic · ${process.env.EMAIL_USER || 'camporganic@gmail.com'}
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `${factura.numero}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
    console.log(`Factura ${factura.numero} enviada a ${email}`);
  } catch (err) {
    console.error(`Error enviando factura a ${email}:`, err.message);
  }
};

export const enviarCambioEstado = (nombre, email, pedido) => {
  const mensajes = {
    confirmado: { titulo: "Tu pedido fue confirmado", desc: "Tu pedido fue confirmado y pronto comenzaremos a prepararlo.", icono: "✓" },
    preparando: { titulo: "Tu pedido está en preparación", desc: "Estamos preparando tu pedido con cuidado.", icono: "📦" },
    enviado:    { titulo: "Tu pedido está en camino", desc: "Tu pedido ya salió y llegará pronto.", icono: "🚚" },
    entregado:  { titulo: "Pedido entregado", desc: "¡Esperamos que disfrutes tu compra!", icono: "✅" },
    cancelado:  { titulo: "Pedido cancelado", desc: "Tu pedido fue cancelado. Contáctanos si tienes dudas.", icono: "❌" },
    devuelto:   { titulo: "Devolución registrada", desc: "Tu devolución fue registrada. El stock fue restaurado.", icono: "↩️" },
    // backward compat
    procesando: { titulo: "Tu pedido está en preparación", desc: "Estamos preparando tu pedido con cuidado.", icono: "📦" },
    completado: { titulo: "Pedido entregado", desc: "¡Esperamos que disfrutes tu compra!", icono: "✅" },
  };

  const estadoDisplay = {
    pendiente: "Pendiente", confirmado: "Confirmado", preparando: "En Preparación",
    enviado: "En Camino", entregado: "Entregado", cancelado: "Cancelado", devuelto: "Devuelto",
    procesando: "En Preparación", completado: "Entregado",
  };
  const info = mensajes[pedido.estado] || { titulo: `Estado actualizado`, desc: "", icono: "📋" };

  const itemsHTML = (pedido.items || []).length > 0
    ? `<table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead>
          <tr style="background:#2D5A27;color:#fff;">
            <th style="padding:8px;text-align:left;font-size:12px;">PRODUCTO</th>
            <th style="padding:8px;text-align:center;font-size:12px;">CANT.</th>
            <th style="padding:8px;text-align:right;font-size:12px;">SUBTOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${(pedido.items || []).map(i => `
            <tr>
              <td style="padding:8px;border-bottom:1px solid #eee;">${i.nombre_producto}</td>
              <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.cantidad} ${i.unidad || "uds."}</td>
              <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">S/.${(i.cantidad * i.precio_unitario).toFixed(2)}</td>
            </tr>`).join("")}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:8px;text-align:right;font-weight:bold;">Total:</td>
            <td style="padding:8px;text-align:right;font-weight:bold;color:#2D5A27;">S/.${parseFloat(pedido.total).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>`
    : "";

  return enviar(
    email,
    `${info.icono} ${info.titulo} — Pedido #${pedido.id}`,
    `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
      <div style="background:#2D5A27;padding:24px 32px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h1 style="color:#fff;margin:0;font-size:22px;">🌿 CampOrganic</h1>
          <p style="color:#c8e6c9;margin:4px 0 0;font-size:13px;">Actualización de pedido</p>
        </div>
        <div style="text-align:right;">
          <p style="color:#fff;margin:0;font-weight:bold;">PEDIDO #${pedido.id}</p>
        </div>
      </div>
      <div style="padding:32px;background:#f9f9f9;">
        <h2 style="color:#2D5A27;margin-top:0;">${info.icono} ${info.titulo}</h2>
        <p>Hola <strong>${nombre}</strong>, ${info.desc}</p>
        <p style="margin-bottom:4px;">Estado actual:
          <strong style="background:#2D5A27;color:#fff;padding:2px 10px;border-radius:20px;font-size:13px;">
            ${estadoDisplay[pedido.estado] || pedido.estado}
          </strong>
        </p>
        ${itemsHTML}
        <div style="text-align:center;margin:32px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/mis-pedidos/${pedido.id}"
             style="background:#2D5A27;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Ver mi pedido
          </a>
        </div>
      </div>
      <div style="padding:16px 32px;background:#f0f0f0;text-align:center;font-size:12px;color:#999;">
        CampOrganic · Productos orgánicos frescos · ${process.env.EMAIL_USER || "camporganic@gmail.com"}
      </div>
    </div>
    `
  );
};

export const enviarResetPassword = (email, token) => {
  const url = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;
  enviar(email, "Restablecer contraseña — CampOrganic", `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
      <div style="background:#2D5A27;padding:24px 32px;">
        <h1 style="color:#fff;margin:0;font-size:22px;">Restablecer contraseña</h1>
      </div>
      <div style="padding:32px;background:#f9f9f9;">
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
        <p>El enlace expira en <strong>30 minutos</strong>. Si no solicitaste este cambio, ignora este mensaje.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${url}" style="background:#2D5A27;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Restablecer contraseña
          </a>
        </div>
        <p style="font-size:12px;color:#999;">O copia este enlace: <a href="${url}">${url}</a></p>
      </div>
      <div style="padding:16px 32px;background:#f0f0f0;text-align:center;font-size:12px;color:#999;">
        CampOrganic · Si no solicitaste este cambio, ignora este email.
      </div>
    </div>
  `);
};
