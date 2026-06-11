import pool from "../config/database.js";
import { generarPDFFactura } from "../services/pdfService.js";
import { enviarFactura } from "../services/emailService.js";

const crearTabla = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS facturas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pedido_id INT NOT NULL,
      tipo ENUM('boleta','factura') NOT NULL DEFAULT 'boleta',
      numero VARCHAR(20) NOT NULL UNIQUE,
      nombre_razon_social VARCHAR(255) NOT NULL,
      tipo_documento ENUM('dni','ruc','ce','pasaporte') NOT NULL DEFAULT 'dni',
      documento VARCHAR(20) NOT NULL,
      direccion TEXT NULL,
      email_envio VARCHAR(255) NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      igv DECIMAL(10,2) NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      pdf_base64 LONGTEXT NULL,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
    )
  `);
};
crearTabla().catch((e) => console.error("Error creando tabla facturas:", e));

const generarNumero = async (tipo) => {
  const serie = tipo === 'factura' ? 'F001' : 'B001';
  const [[{ total }]] = await pool.execute(
    "SELECT COUNT(*) AS total FROM facturas WHERE tipo = ?", [tipo]
  );
  const secuencia = String(Number(total) + 1).padStart(8, '0');
  return `${serie}-${secuencia}`;
};

// POST /facturas — crear factura/boleta para un pedido
export const crearFactura = async (req, res) => {
  try {
    const {
      pedido_id, tipo = 'boleta',
      nombre_razon_social, tipo_documento = 'dni', documento,
      direccion, email_envio,
    } = req.body;
    const usuarioId = req.user.id;

    if (!pedido_id || !nombre_razon_social || !documento) {
      return res.status(400).json({ error: "pedido_id, nombre_razon_social y documento son requeridos" });
    }
    if (!['boleta', 'factura'].includes(tipo)) {
      return res.status(400).json({ error: "tipo debe ser 'boleta' o 'factura'" });
    }
    if (tipo === 'factura' && tipo_documento !== 'ruc') {
      return res.status(400).json({ error: "Las facturas requieren RUC" });
    }
    if (tipo === 'factura' && documento.length !== 11) {
      return res.status(400).json({ error: "El RUC debe tener 11 dígitos" });
    }

    // Verificar pedido
    const [[pedido]] = await pool.execute(
      `SELECT p.*, u.nombre AS cliente_nombre, u.email AS cliente_email
       FROM pedidos p LEFT JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = ?`,
      [pedido_id]
    );
    if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });
    if (pedido.usuario_id !== usuarioId && req.user.rol !== "admin") {
      return res.status(403).json({ error: "Sin permiso" });
    }

    // No permitir doble facturación
    const [[yaExiste]] = await pool.execute(
      "SELECT id FROM facturas WHERE pedido_id = ?", [pedido_id]
    );
    if (yaExiste) {
      return res.status(400).json({ error: "Este pedido ya tiene un comprobante emitido" });
    }

    const [items] = await pool.execute(
      "SELECT * FROM detalle_pedidos WHERE pedido_id = ?", [pedido_id]
    );

    const total = parseFloat(pedido.total);
    const igv = parseFloat((total - total / 1.18).toFixed(2));
    const subtotal = parseFloat((total - igv).toFixed(2));
    const numero = await generarNumero(tipo);
    const emailDestino = email_envio || pedido.cliente_email;

    // Insertar factura
    const [result] = await pool.execute(
      `INSERT INTO facturas
         (pedido_id, tipo, numero, nombre_razon_social, tipo_documento, documento,
          direccion, email_envio, subtotal, igv, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [pedido_id, tipo, numero, nombre_razon_social, tipo_documento, documento,
       direccion || null, emailDestino, subtotal, igv, total]
    );
    const facturaId = result.insertId;

    // Generar PDF
    const [[facturaRow]] = await pool.execute("SELECT * FROM facturas WHERE id = ?", [facturaId]);
    const pdfBuffer = await generarPDFFactura(facturaRow, pedido, items);
    const pdfBase64 = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;

    await pool.execute("UPDATE facturas SET pdf_base64 = ? WHERE id = ?", [pdfBase64, facturaId]);

    // Enviar por email (no bloqueante)
    if (emailDestino) {
      enviarFactura(nombre_razon_social, emailDestino, facturaRow, pdfBuffer).catch(console.error);
    }

    const [[facturaFinal]] = await pool.execute(
      "SELECT id, pedido_id, tipo, numero, nombre_razon_social, tipo_documento, documento, subtotal, igv, total, creado_en FROM facturas WHERE id = ?",
      [facturaId]
    );

    res.status(201).json({
      success: true,
      data: facturaFinal,
      message: `${tipo === 'factura' ? 'Factura' : 'Boleta'} ${numero} emitida y enviada por email`,
    });
  } catch (error) {
    console.error("Error creando factura:", error);
    res.status(500).json({ error: "Error del servidor al generar el comprobante" });
  }
};

// GET /facturas — listar todas (admin)
export const getAllFacturas = async (req, res) => {
  try {
    if (req.user.rol !== "admin") return res.status(403).json({ error: "Solo admin" });
    const [facturas] = await pool.execute(
      `SELECT f.id, f.pedido_id, f.tipo, f.numero, f.nombre_razon_social,
              f.tipo_documento, f.documento, f.subtotal, f.igv, f.total, f.email_envio,
              f.creado_en,
              COALESCE(u.nombre, c.contacto_nombre) AS cliente_nombre
       FROM facturas f
       JOIN pedidos p ON f.pedido_id = p.id
       LEFT JOIN usuarios u ON p.usuario_id = u.id
       LEFT JOIN clientes c ON p.cliente_id = c.id
       ORDER BY f.creado_en DESC`
    );
    res.json({ success: true, data: facturas });
  } catch (error) {
    console.error("Error listando facturas:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// GET /facturas/pedido/:pedido_id — factura de un pedido
export const getFacturaPorPedido = async (req, res) => {
  try {
    const { pedido_id } = req.params;
    const [[pedido]] = await pool.execute("SELECT usuario_id FROM pedidos WHERE id = ?", [pedido_id]);
    if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });
    if (pedido.usuario_id !== req.user.id && req.user.rol !== "admin") {
      return res.status(403).json({ error: "Sin permiso" });
    }
    const [[factura]] = await pool.execute(
      "SELECT id, pedido_id, tipo, numero, nombre_razon_social, tipo_documento, documento, subtotal, igv, total, email_envio, creado_en FROM facturas WHERE pedido_id = ?",
      [pedido_id]
    );
    if (!factura) return res.status(404).json({ error: "Sin comprobante para este pedido" });
    res.json({ success: true, data: factura });
  } catch (error) {
    res.status(500).json({ error: "Error del servidor" });
  }
};

// GET /facturas/:id/pdf — descargar PDF
export const getPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const [[factura]] = await pool.execute(
      "SELECT f.*, p.usuario_id FROM facturas f JOIN pedidos p ON f.pedido_id = p.id WHERE f.id = ?",
      [id]
    );
    if (!factura) return res.status(404).json({ error: "Factura no encontrada" });
    if (factura.usuario_id !== req.user.id && req.user.rol !== "admin") {
      return res.status(403).json({ error: "Sin permiso" });
    }
    if (!factura.pdf_base64) return res.status(404).json({ error: "PDF no disponible" });
    res.json({ success: true, data: { pdf: factura.pdf_base64, numero: factura.numero, tipo: factura.tipo } });
  } catch (error) {
    res.status(500).json({ error: "Error del servidor" });
  }
};
