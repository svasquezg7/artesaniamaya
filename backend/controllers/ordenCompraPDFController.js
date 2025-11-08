import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import db from '../config/db.js';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generarPDF = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ 1. Cabecera de la orden
    const [orden] = await db.execute(
      `SELECT oc.id_orden, oc.fecha_orden, oc.estado, oc.total,
              p.nombre AS proveedor, p.telefono, p.correo
       FROM orden_compra oc
       LEFT JOIN proveedores p ON oc.id_proveedor = p.id_proveedor
       WHERE oc.id_orden = ?`,
      [id]
    );

    if (!orden.length) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    const cab = orden[0];

    // ✅ 2. Detalle
    const [detalles] = await db.execute(
      `SELECT codigo_producto, nombre_producto, cantidad, precio_compra
       FROM orden_compra_detalle WHERE id_orden = ?`,
      [id]
    );

    // ✅ 3. Crear PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 820]);
    const { height, width } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 60;

    // === 🎨 ENCABEZADO COLORIDO ===
    page.drawRectangle({
      x: 0,
      y: height - 100,
      width,
      height: 100,
      color: rgb(0.55, 0.43, 0.39) // #8D6E63
    });

    try {
      const logoPath = path.join(__dirname, '../../frontend/public/logo-blanco.svg');
      const svgBuffer = await readFile(logoPath);
      const pngBuffer = await sharp(svgBuffer).png().toBuffer();
      const logoImage = await pdfDoc.embedPng(pngBuffer);
      page.drawImage(logoImage, { x: 40, y: height - 90, width: 80, height: 60 });
    } catch (err) {
      console.warn(' No se pudo cargar el logo SVG del frontend:', err.message);
    }

    page.drawText('ARTESANÍA MAYA', {
      x: 150,
      y: height - 55,
      size: 20,
      font: bold,
      color: rgb(1, 1, 1)
    });

    page.drawText('ORDEN DE COMPRA', {
      x: 150,
      y: height - 75,
      size: 13,
      font,
      color: rgb(1, 1, 1)
    });

    // Línea decorativa bajo encabezado
    page.drawLine({
      start: { x: 50, y: height - 110 },
      end: { x: 550, y: height - 110 },
      thickness: 2,
      color: rgb(0.63, 0.53, 0.49) // #A1887F
    });
// === 🧾 BLOQUE DE INFORMACIÓN DE CABECERA (VERSIÓN COLORIDA) ===
y = height - 150;

// Fondo principal con marco
page.drawRectangle({
  x: 40,
  y: y - 130,
  width: 520,
  height: 130,
  color: rgb(0.95, 0.93, 0.90), // beige claro
  borderColor: rgb(0.45, 0.33, 0.28), // café oscuro
  borderWidth: 1.2,
});

// Encabezado de color (banda superior)
page.drawRectangle({
  x: 40,
  y: y - 25,
  width: 520,
  height: 25,
  color: rgb(0.55, 0.43, 0.39), // #8D6E63
});

// Texto del encabezado
page.drawText('INFORMACIÓN DE LA ORDEN', {
  x: 50,
  y: y - 18,
  size: 12,
  font: bold,
  color: rgb(1, 1, 1),
});

// Datos de la orden
const info = [
  ['Orden No.:', cab.id_orden],
  ['Proveedor:', cab.proveedor || 'N/A'],
  ['Correo:', cab.correo || 'N/A'],
  ['Teléfono:', cab.telefono || 'N/A'],
  ['Fecha:', new Date(cab.fecha_orden).toLocaleDateString()],
];

let infoY = y - 45;

info.forEach(([label, value], index) => {
  // Línea divisoria entre filas
  if (index > 0) {
    page.drawLine({
      start: { x: 50, y: infoY + 10 },
      end: { x: 540, y: infoY + 10 },
      thickness: 0.3,
      color: rgb(0.7, 0.6, 0.55),
    });
  }

  page.drawText(label, {
    x: 60,
    y: infoY,
    size: 11,
    font: bold,
    color: rgb(0.24, 0.15, 0.13), // marrón oscuro
  });

  page.drawText(value.toString(), {
    x: 160,
    y: infoY,
    size: 11,
    font,
    color: rgb(0.35, 0.25, 0.2),
  });

  infoY -= 18;
});

y = infoY - 15;

    // === 📋 TABLA DE DETALLES ===
    y -= 30;
    const headers = ['Código', 'Producto', 'Cantidad', 'Precio', 'Subtotal'];
    const positions = [50, 130, 310, 400, 480];

    // Fondo del encabezado de tabla
    page.drawRectangle({ x: 45, y: y - 5, width: 510, height: 20, color: rgb(0.93, 0.91, 0.88) }); // #EFEBE9
    headers.forEach((text, i) => {
      page.drawText(text, { x: positions[i], y: y, size: 11, font: bold, color: rgb(0.24, 0.15, 0.13) });
    });
    y -= 25;

    let total = 0;
    for (const p of detalles) {
      const cantidad = Number(p.cantidad) || 0;
      const precio = Number(p.precio_compra) || 0;
      const subtotal = cantidad * precio;
      total += subtotal;

      const values = [
        p.codigo_producto?.toString() || '',
        p.nombre_producto?.toString() || '',
        cantidad.toString(),
        `Q${precio.toFixed(2)}`,
        `Q${subtotal.toFixed(2)}`
      ];

      values.forEach((val, i) => {
        page.drawText(val, { x: positions[i], y, size: 10, font, color: rgb(0.24, 0.15, 0.13) });
      });

      y -= 18;
    }

    // === 💰 TOTAL ===
    y -= 15;
    page.drawLine({ start: { x: 400, y }, end: { x: 550, y }, thickness: 1, color: rgb(0.24, 0.15, 0.13) });
    y -= 20;
    page.drawText(`TOTAL: Q${total.toFixed(2)}`, {
      x: 410,
      y,
      size: 13,
      font: bold,
      color: rgb(0.18, 0.33, 0.20) // #2E7D32 verde artesanal
    });

    // === ✍️ FIRMA ===
    y -= 60;
    page.drawLine({ start: { x: 80, y }, end: { x: 260, y }, thickness: 1, color: rgb(0.24, 0.15, 0.13) });
    page.drawText('Firma de autorización', { x: 100, y: y - 15, size: 10, font });

    // === 📄 PIE DE PÁGINA ===
    const footerY = 40;
    page.drawLine({
      start: { x: 50, y: footerY + 20 },
      end: { x: 550, y: footerY + 20 },
      thickness: 1,
      color: rgb(0.63, 0.53, 0.49)
    });

    const fechaEmision = new Date().toLocaleDateString();
    page.drawText('ARTESANÍA MAYA - Sistema de Gestión', {
      x: 50,
      y: footerY + 5,
      size: 9,
      font,
      color: rgb(0.38, 0.27, 0.23)
    });
    page.drawText(`Emitido el ${fechaEmision}`, {
      x: 450,
      y: footerY + 5,
      size: 9,
      font,
      color: rgb(0.38, 0.27, 0.23)
    });

    // ✅ 4. Enviar PDF
    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=orden_${id}.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Error al generar PDF:', error.message);
    res.status(500).json({ message: 'Error al generar PDF', error: error.message });
  }
};
