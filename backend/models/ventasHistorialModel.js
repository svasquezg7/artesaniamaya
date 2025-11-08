import db from '../config/db.js';

const VentasHistorialModel = {
  // ✅ búsqueda por un día (fecha), texto y cajero
  search: async ({ q, fecha, cajero }) => {
    const params = [];
    let where = '1=1';

    if (q && q.trim()) {
      where += ' AND (v.id_venta LIKE ? OR v.notas LIKE ?)';
      params.push('%' + q + '%', '%' + q + '%');
    }

    // Un solo día
    if (fecha && fecha.trim()) {
      where += ' AND DATE(v.fecha) = ?';
      params.push(fecha.trim());
    } else {
      // Por defecto: hoy
      where += ' AND DATE(v.fecha) = CURDATE()';
    }

    if (cajero && cajero.trim()) {
      where += ' AND v.cajero = ?';
      params.push(cajero.trim());
    }

    const [rows] = await db.execute(
      `
      SELECT v.id_venta AS folio,
             DATE_FORMAT(v.fecha,'%H:%i') AS hora,
             v.cajero,
             COUNT(vd.id_detalle) AS articulos,
             ROUND(SUM(vd.cantidad*vd.precio_venta - vd.descuento),2) AS total,
             v.estado
        FROM venta v
        JOIN venta_detalle vd ON vd.id_venta = v.id_venta
       WHERE ${where}
       GROUP BY v.id_venta
       ORDER BY v.id_venta DESC
       LIMIT 500
      `,
      params
    );
    return rows;
  },

  getById: async (id_venta) => {
    const [[cab]] = await db.execute(
      `SELECT id_venta, DATE_FORMAT(fecha,'%Y-%m-%d %H:%i') AS fecha,
              cajero, id_cliente, total, estado, notas
         FROM venta WHERE id_venta=?`,
      [id_venta]
    );
    if (!cab) return null;

    const [det] = await db.execute(
      `SELECT id_detalle, codigo_producto, nombre_producto,
              cantidad, cantidad_devuelta, precio_venta, descuento, es_comun,
              (cantidad*precio_venta - descuento) AS importe
         FROM venta_detalle
        WHERE id_venta=?
        ORDER BY id_detalle`,
      [id_venta]
    );

    const [devs] = await db.execute(
      `SELECT d.id_devolucion, DATE_FORMAT(d.fecha,'%Y-%m-%d %H:%i') AS fecha,
              d.cajero, d.motivo, d.total_reintegrado
         FROM devolucion d
        WHERE d.id_venta=?
        ORDER BY d.id_devolucion DESC`,
      [id_venta]
    );

    return { cabecera: cab, detalles: det, devoluciones: devs };
  },

  getReturnsBySale: async (id_venta) => {
    const [rows] = await db.execute(
      `SELECT d.id_devolucion, DATE_FORMAT(d.fecha,'%Y-%m-%d %H:%i') AS fecha,
              d.cajero, d.motivo, d.total_reintegrado
         FROM devolucion d
        WHERE d.id_venta=?
        ORDER BY d.id_devolucion DESC`,
      [id_venta]
    );
    return rows;
  },

  // ✅ nuevo: cajeros reales desde tabla usuarios (activos)
  listCashiers: async () => {
    // Ajusta nombres de columnas a tu esquema real de "usuarios"
    const [rows] = await db.execute(
      `SELECT id_usuario, usuario, nombre
         FROM usuarios
        WHERE activo = 1
        ORDER BY nombre`
    );
    // Devuelve como [{cajero:'USUARIO', nombre:'Nombre visible'}]
    return rows.map((u) => ({ cajero: u.usuario, nombre: u.nombre || u.usuario }));

    /* Alternativa (si no hay "usuarios"):
    const [rows] = await db.execute(
      `SELECT DISTINCT cajero FROM venta WHERE cajero IS NOT NULL ORDER BY cajero`
    );
    return rows.map(r => ({ cajero:r.cajero, nombre:r.cajero }));
    */
  }
};

export default VentasHistorialModel;
