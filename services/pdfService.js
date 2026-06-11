import PDFDocument from 'pdfkit';

const VERDE = '#2D5A27';
const GRIS = '#666666';

export const generarPDFFactura = (factura, pedido, items) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];
    doc.on('data', (c) => buffers.push(c));
    doc.on('end',  () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const esFactura = factura.tipo === 'factura';
    const fecha = new Date(factura.creado_en || Date.now()).toLocaleDateString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });

    // ── Encabezado ──────────────────────────────────────────────────
    doc.fontSize(22).fillColor(VERDE).font('Helvetica-Bold').text('CampOrganic', 50, 50);
    doc.fontSize(9).fillColor(GRIS).font('Helvetica')
      .text('Productos Orgánicos Frescos', 50, 77)
      .text(`RUC: ${process.env.EMPRESA_RUC || '20000000000'}`, 50, 89)
      .text(process.env.EMPRESA_DIRECCION || 'Lima, Perú', 50, 101);

    // Tipo de comprobante (derecha)
    doc.fontSize(13).fillColor(VERDE).font('Helvetica-Bold')
      .text(esFactura ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA', 300, 50, { width: 245, align: 'right' });
    doc.fontSize(10).fillColor('#000').font('Helvetica-Bold')
      .text(factura.numero, 300, 70, { width: 245, align: 'right' });
    doc.fontSize(9).fillColor(GRIS).font('Helvetica')
      .text(`Fecha: ${fecha}`, 300, 85, { width: 245, align: 'right' });

    doc.moveTo(50, 120).lineTo(545, 120).strokeColor('#cccccc').lineWidth(1).stroke();

    // ── Datos del cliente ────────────────────────────────────────────
    doc.fontSize(8).fillColor(GRIS).font('Helvetica-Bold').text('CLIENTE / RECEPTOR', 50, 130);
    doc.fontSize(10).fillColor('#000').font('Helvetica-Bold').text(factura.nombre_razon_social, 50, 143);
    doc.fontSize(9).fillColor(GRIS).font('Helvetica')
      .text(`${factura.tipo_documento.toUpperCase()}: ${factura.documento}`, 50, 157);
    if (factura.direccion) {
      doc.text(`Dirección: ${factura.direccion}`, 50, 169);
    }

    const metodoLabel = {
      efectivo: 'Pago contra entrega', yape: 'Yape',
      plin: 'Plin', transferencia: 'Transferencia bancaria', tarjeta: 'Tarjeta',
    };
    doc.fontSize(9).fillColor(GRIS)
      .text(`Pedido #: ${factura.pedido_id}`, 350, 143, { width: 195, align: 'right' })
      .text(`Método: ${metodoLabel[pedido.metodo_pago] || pedido.metodo_pago || ''}`, 350, 157, { width: 195, align: 'right' });

    const y0 = factura.direccion ? 198 : 185;
    doc.moveTo(50, y0).lineTo(545, y0).strokeColor('#cccccc').lineWidth(0.5).stroke();

    // ── Tabla de productos ──────────────────────────────────────────
    let y = y0 + 10;

    // Cabecera
    doc.rect(50, y, 495, 20).fill(VERDE);
    doc.fontSize(8).fillColor('#fff').font('Helvetica-Bold');
    doc.text('DESCRIPCIÓN', 58, y + 5);
    doc.text('CANT.', 310, y + 5, { width: 55, align: 'center' });
    doc.text('P. UNITARIO', 368, y + 5, { width: 80, align: 'right' });
    doc.text('TOTAL', 453, y + 5, { width: 80, align: 'right' });
    y += 20;

    doc.fillColor('#000').font('Helvetica').fontSize(9);
    (items || []).forEach((item, i) => {
      if (i % 2 === 0) doc.rect(50, y, 495, 20).fill('#f7f7f7').stroke('#f0f0f0');
      doc.fillColor('#000');
      const nombre = item.nombre_producto || item.descripcion || '';
      doc.text(nombre, 58, y + 5, { width: 247, ellipsis: true });
      doc.text(String(item.cantidad), 310, y + 5, { width: 55, align: 'center' });
      doc.text(`S/.${parseFloat(item.precio_unitario).toFixed(2)}`, 368, y + 5, { width: 80, align: 'right' });
      doc.text(`S/.${(item.cantidad * parseFloat(item.precio_unitario)).toFixed(2)}`, 453, y + 5, { width: 80, align: 'right' });
      y += 20;
    });

    doc.moveTo(50, y).lineTo(545, y).strokeColor('#cccccc').lineWidth(0.5).stroke();
    y += 14;

    // ── Totales ──────────────────────────────────────────────────────
    const tx = 350;
    doc.fontSize(9).font('Helvetica');
    doc.fillColor(GRIS).text('Operaciones gravadas:', tx, y, { width: 120 });
    doc.fillColor('#000').text(`S/.${parseFloat(factura.subtotal).toFixed(2)}`, tx + 120, y, { width: 75, align: 'right' });
    y += 16;
    doc.fillColor(GRIS).text('IGV (18%):', tx, y, { width: 120 });
    doc.fillColor('#000').text(`S/.${parseFloat(factura.igv).toFixed(2)}`, tx + 120, y, { width: 75, align: 'right' });
    y += 18;
    doc.rect(tx, y, 195, 24).fill(VERDE);
    doc.fontSize(11).fillColor('#fff').font('Helvetica-Bold')
      .text('IMPORTE TOTAL:', tx + 5, y + 6, { width: 115 });
    doc.text(`S/.${parseFloat(factura.total).toFixed(2)}`, tx + 120, y + 6, { width: 70, align: 'right' });

    // ── Nota pie ────────────────────────────────────────────────────
    doc.fontSize(8).fillColor(GRIS).font('Helvetica')
      .text('Son: ' + importeEnLetras(parseFloat(factura.total)), 50, y + 4, { width: 285 });

    // ── Footer ───────────────────────────────────────────────────────
    doc.moveTo(50, 760).lineTo(545, 760).strokeColor('#cccccc').lineWidth(0.5).stroke();
    doc.fontSize(8).fillColor(GRIS)
      .text('CampOrganic · Productos Orgánicos Frescos', 50, 768, { align: 'center', width: 495 })
      .text(`${process.env.EMAIL_USER || 'camporganic@gmail.com'}`, 50, 779, { align: 'center', width: 495 });

    doc.end();
  });

function importeEnLetras(monto) {
  const entero = Math.floor(monto);
  const centavos = Math.round((monto - entero) * 100);
  return `${entero} con ${String(centavos).padStart(2, '0')}/100 Soles`;
}
