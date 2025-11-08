import db from '../config/db.js';

const RecepcionCompraModel = {
  // ===== LISTAR =====
  list: async () => {
    const [rows] = await db.execute(`
      SELECT rc.id_recepcion,
             rc.id_orden,
             DATE_FORMAT(rc.fecha_recepcion, '%Y-%m-%d') AS fecha_recepcion,
             rc.no_factura,
             DATE_FORMAT(rc.fecha_factura, '%Y-%m-%d') AS fecha_factura,
             rc.estado,
             p.nombre AS proveedor
      FROM recepcion_compra rc
      JOIN proveedores p ON p.id_proveedor = rc.id_proveedor
      ORDER BY rc.id_recepcion DESC
    `);
    return rows;
  },

  // ===== OBTENER =====
  getById: async (id_recepcion) => {
    const [[cab]] = await db.execute(`
      SELECT rc.*,
             DATE_FORMAT(rc.fecha_recepcion, '%Y-%m-%d') AS fecha_recepcion,
             DATE_FORMAT(rc.fecha_factura, '%Y-%m-%d') AS fecha_factura,
             p.nombre AS proveedor
      FROM recepcion_compra rc
      JOIN proveedores p ON p.id_proveedor = rc.id_proveedor
      WHERE rc.id_recepcion = ?
    `, [id_recepcion]);
    if (!cab) return null;

    const [det] = await db.execute(`
      SELECT codigo_producto, nombre_producto, cantidad, precio_compra, precio_venta
      FROM recepcion_compra_detalle
      WHERE id_recepcion = ?
      ORDER BY id_detalle
    `, [id_recepcion]);

    return { cabecera: cab, detalles: det };
  },

  // ===== OBTENER DETALLE (plano para modal) =====
  getWithDetalle: async (id_recepcion) => {
    const [[h]] = await db.execute(`
      SELECT rc.id_recepcion, rc.id_orden, rc.id_proveedor,
             DATE_FORMAT(rc.fecha_recepcion, '%Y-%m-%d') AS fecha_recepcion,
             rc.no_factura,
             DATE_FORMAT(rc.fecha_factura, '%Y-%m-%d') AS fecha_factura,
             rc.observaciones, rc.estado,
             p.nombre AS proveedor
      FROM recepcion_compra rc
      JOIN proveedores p ON p.id_proveedor = rc.id_proveedor
      WHERE rc.id_recepcion = ?
    `, [id_recepcion]);
    if (!h) return null;

    const [detalle] = await db.execute(`
      SELECT codigo_producto, nombre_producto, cantidad, precio_compra, precio_venta
      FROM recepcion_compra_detalle
      WHERE id_recepcion = ?
      ORDER BY id_detalle
    `, [id_recepcion]);

    return { ...h, detalle };
  },

  // ===== UTILS =====
  getOrdenesGeneradas: async () => {
    const [rows] = await db.execute(`
      SELECT oc.id_orden,
             DATE_FORMAT(oc.fecha_orden, '%Y-%m-%d') AS fecha_orden,
             p.id_proveedor, p.nombre AS proveedor
      FROM orden_compra oc
      JOIN proveedores p ON p.id_proveedor = oc.id_proveedor
      WHERE oc.estado IN ('GENERADA','PARCIAL')   -- seguimos pudiendo recibir
      ORDER BY oc.id_orden DESC
    `);
    return rows;
  },

  getProductoByCodigo: async (codigo) => {
    const [rows] = await db.execute(`
      SELECT codigo_producto, nombre, precio_compra, precio_venta
      FROM productos
      WHERE codigo_producto = ?
    `, [codigo]);
    return rows[0];
  },

  // ======== CREAR RECEPCIÓN (FLEXIBLE) ========
  create: async (cabecera, detalles) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const { id_orden, id_proveedor, no_factura, fecha_factura, fecha_recepcion, observaciones } = cabecera;

      // 1) Validar OC y proveedor
      const [[oc]] = await conn.execute(
        `SELECT id_orden, id_proveedor, estado FROM orden_compra WHERE id_orden = ? FOR UPDATE`,
        [id_orden]
      );
      if (!oc) throw new Error('La Orden de Compra no existe');
      if (Number(oc.id_proveedor) !== Number(id_proveedor))
        throw new Error('El proveedor no coincide con la Orden de Compra');
      if (['CANCELADA','COMPLETA'].includes(oc.estado))
        throw new Error(`La OC está en estado ${oc.estado} y no admite recepción`);

      // 2) Cargar detalle de OC (para actualizar recibido cuando aplique)
      const [ocDet] = await conn.execute(
        `SELECT codigo_producto, cantidad, IFNULL(recibido,0) AS recibido
           FROM orden_compra_detalle
          WHERE id_orden = ?`,
        [id_orden]
      );
      const ocMap = new Map(ocDet.map(r => [String(r.codigo_producto), { cantidad: Number(r.cantidad), recibido: Number(r.recibido) }]));

      // 3) Validar existencia de productos (solo que existan en tabla productos)
      for (const d of detalles) {
        const codigo = String(d.codigo_producto || '').trim();
        if (!codigo) throw new Error('Código de producto vacío');
        const [[p]] = await conn.execute(
          `SELECT codigo_producto FROM productos WHERE codigo_producto = ?`,
          [codigo]
        );
        if (!p) throw new Error(`El producto ${codigo} no existe en Productos`);
        if (Number(d.cantidad) <= 0) throw new Error(`Cantidad inválida para ${codigo}`);
        if (Number(d.precio_compra) < 0 || Number(d.precio_venta) < 0) throw new Error(`Precios inválidos en ${codigo}`);
      }

      // 4) Insertar encabezado de recepción (estado = CERRADA)
      const [ins] = await conn.execute(`
        INSERT INTO recepcion_compra
          (id_orden, id_proveedor, no_factura, fecha_factura, fecha_recepcion, observaciones, estado)
        VALUES (?, ?, ?, ?, ?, ?, 'CERRADA')
      `, [id_orden, id_proveedor, no_factura || null, fecha_factura || null, fecha_recepcion, observaciones || null]);
      const id_recepcion = ins.insertId;

      // 5) Procesar líneas: actualizar producto, detalle recepción, inventario,
      //    y si el código está en la OC, sumar a 'recibido' (recortado al máximo).
      for (const d of detalles) {
        const codigo  = String(d.codigo_producto).trim();
        const nombre  = d.nombre_producto || null;
        const cant    = Number(d.cantidad);
        const pcompra = Number(d.precio_compra);
        const pventa  = Number(d.precio_venta);

        // 5.1) Actualizar datos del producto (nombre y precios)
        await conn.execute(`
          UPDATE productos 
             SET nombre = IFNULL(?, nombre),
                 precio_compra = ?,
                 precio_venta  = ?
           WHERE codigo_producto = ?
        `, [nombre, pcompra, pventa, codigo]);

        // 5.2) Insertar detalle recepción
        await conn.execute(`
          INSERT INTO recepcion_compra_detalle
            (id_recepcion, codigo_producto, nombre_producto, cantidad, precio_compra, precio_venta)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [id_recepcion, codigo, nombre ?? '', cant, pcompra, pventa]);

        // 5.3) Inventario: sumar cantidad (upsert)
        const [[inv]] = await conn.execute(
          `SELECT cantidad FROM inventario WHERE codigo_producto = ? FOR UPDATE`,
          [codigo]
        );
        if (!inv) {
          await conn.execute(
            `INSERT INTO inventario (codigo_producto, cantidad, stock_minimo) VALUES (?, ?, 0)`,
            [codigo, cant]
          );
        } else {
          await conn.execute(
            `UPDATE inventario SET cantidad = ? WHERE codigo_producto = ?`,
            [Number(inv.cantidad) + cant, codigo]
          );
        }

        // 5.4) Si el producto existe en la OC, sumar a 'recibido' (sin error si excede; se recorta)
        const ocLine = ocMap.get(codigo);
        if (ocLine) {
          await conn.execute(
            `UPDATE orden_compra_detalle
                SET recibido = LEAST(cantidad, IFNULL(recibido,0) + ?)
              WHERE id_orden = ? AND codigo_producto = ?`,
            [cant, id_orden, codigo]
          );
          // Actualizar el mapa en memoria (opcional)
          ocLine.recibido = Math.min(ocLine.cantidad, ocLine.recibido + cant);
        }
      }

      // 6) Recalcular estado de la OC solo con sus propias líneas
      //    (si todas las líneas de la OC están completas -> COMPLETA, si algunas tienen algo -> PARCIAL)
      const [[tot]] = await conn.execute(
        `SELECT SUM(cantidad) AS qty, SUM(IFNULL(recibido,0)) AS rec
           FROM orden_compra_detalle
          WHERE id_orden = ?`,
        [id_orden]
      );
      const estadoOC = (Number(tot.rec) >= Number(tot.qty) && Number(tot.qty) > 0)
        ? 'COMPLETA'
        : (Number(tot.rec) > 0 ? 'PARCIAL' : 'GENERADA');

      await conn.execute(
        `UPDATE orden_compra SET estado = ? WHERE id_orden = ?`,
        [estadoOC, id_orden]
      );

      await conn.commit();
      conn.release();

      return { id_recepcion, estadoOC };
    } catch (e) {
      await conn.rollback();
      conn.release();
      throw e;
    }
  },

  // ===== ANULAR (revierte inventario y recibido OC) =====
  anular: async (id_recepcion, _motivo) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [[rc]] = await conn.execute(
        `SELECT id_recepcion, id_orden, estado FROM recepcion_compra WHERE id_recepcion = ? FOR UPDATE`,
        [id_recepcion]
      );
      if (!rc) throw new Error('Recepción no existe');
      if (rc.estado === 'ANULADA') throw new Error('La recepción ya está anulada');

      const [det] = await conn.execute(
        `SELECT codigo_producto, cantidad FROM recepcion_compra_detalle WHERE id_recepcion = ?`,
        [id_recepcion]
      );

      // Revertir inventario y recibido en OC (solo para códigos que estén en OC)
      for (const it of det) {
        // Inventario
        const [[inv]] = await conn.execute(
          `SELECT cantidad FROM inventario WHERE codigo_producto = ? FOR UPDATE`,
          [it.codigo_producto]
        );
        if (!inv) throw new Error(`Inventario inexistente para ${it.codigo_producto}`);
        const nueva = Number(inv.cantidad) - Number(it.cantidad);
        if (nueva < 0) throw new Error(`Inventario negativo al anular ${it.codigo_producto}`);
        await conn.execute(
          `UPDATE inventario SET cantidad = ? WHERE codigo_producto = ?`,
          [nueva, it.codigo_producto]
        );

        // Recibido en OC (solo si la línea existe)
        await conn.execute(
          `UPDATE orden_compra_detalle
              SET recibido = GREATEST(0, IFNULL(recibido,0) - ?)
            WHERE id_orden = ? AND codigo_producto = ?`,
          [Number(it.cantidad), rc.id_orden, it.codigo_producto]
        );
      }

      // Recalcular estado de OC
      const [[tot]] = await conn.execute(
        `SELECT SUM(cantidad) AS qty, SUM(IFNULL(recibido,0)) AS rec
           FROM orden_compra_detalle
          WHERE id_orden = ?`,
        [rc.id_orden]
      );
      const estadoOC = (Number(tot.rec) >= Number(tot.qty) && Number(tot.qty) > 0)
        ? 'COMPLETA'
        : (Number(tot.rec) > 0 ? 'PARCIAL' : 'GENERADA');

      await conn.execute(
        `UPDATE orden_compra SET estado = ? WHERE id_orden = ?`,
        [estadoOC, rc.id_orden]
      );

      // Marcar recepción anulada
      await conn.execute(
        `UPDATE recepcion_compra SET estado = 'ANULADA' WHERE id_recepcion = ?`,
        [id_recepcion]
      );

      await conn.commit();
      conn.release();

      return { message: 'Recepción anulada', id_recepcion, estadoOC };
    } catch (e) {
      await conn.rollback();
      conn.release();
      throw e;
    }
  }
};

export default RecepcionCompraModel;

