import db from '../config/db.js';

const OrdenCompraModel = {
  // ======= LISTAR =======
  list: async () => {
    const [rows] = await db.execute(`
      SELECT oc.id_orden,
             DATE_FORMAT(oc.fecha_orden, '%Y-%m-%d') AS fecha_orden,
             oc.estado,
             oc.solicitado_por,
             p.nombre AS proveedor,
             IFNULL(SUM(ocd.subtotal), 0) AS total
      FROM orden_compra oc
      JOIN proveedores p ON p.id_proveedor = oc.id_proveedor
      LEFT JOIN orden_compra_detalle ocd ON ocd.id_orden = oc.id_orden
      GROUP BY oc.id_orden
      ORDER BY oc.id_orden DESC
    `);
    return rows;
  },

  // ======= OBTENER ORDEN POR ID (para EDITAR) =======
  getById: async (id_orden) => {
    const [[cab]] = await db.execute(`
      SELECT 
        oc.id_orden,
        oc.id_proveedor,
        DATE_FORMAT(oc.fecha_orden, '%Y-%m-%d') AS fecha_orden,
        oc.solicitado_por,
        oc.telefono,
        oc.comentario,
        oc.estado,
        IFNULL(oc.total, 0) AS total,
        p.nombre AS proveedor
      FROM orden_compra oc
      JOIN proveedores p ON p.id_proveedor = oc.id_proveedor
      WHERE oc.id_orden = ?
    `, [id_orden]);

    if (!cab) return { cabecera: {}, detalles: [] };

    const [det] = await db.execute(`
      SELECT codigo_producto, nombre_producto, cantidad, precio_compra, subtotal
      FROM orden_compra_detalle
      WHERE id_orden = ?
      ORDER BY id_detalle
    `, [id_orden]);

    return { cabecera: cab, detalles: det };
  },

  // ======= OBTENER DETALLES (para el botón "Detalles") =======
  getWithDetalle: async (id_orden) => {
    // Este devuelve plano, para que el modal de detalles cargue bien
    const [[orden]] = await db.execute(`
      SELECT 
        oc.id_orden,
        DATE_FORMAT(oc.fecha_orden, '%Y-%m-%d') AS fecha_orden,
        oc.solicitado_por,
        oc.telefono,
        oc.comentario,
        oc.estado,
        IFNULL(oc.total, 0) AS total,
        p.nombre AS proveedor
      FROM orden_compra oc
      JOIN proveedores p ON p.id_proveedor = oc.id_proveedor
      WHERE oc.id_orden = ?
    `, [id_orden]);

    if (!orden) return null;

    const [detalle] = await db.execute(`
      SELECT codigo_producto, nombre_producto, cantidad, precio_compra, subtotal
      FROM orden_compra_detalle
      WHERE id_orden = ?
      ORDER BY id_detalle
    `, [id_orden]);

    // ⬅️ EXACTAMENTE la estructura que tu modal de detalles espera:
    return { ...orden, detalle };
  },

  // ======= PROVEEDORES =======
  getProveedores: async () => {
    const [rows] = await db.execute(`
      SELECT id_proveedor, nombre, empresa
      FROM proveedores
      WHERE estado = 'ACTIVO'
      ORDER BY nombre
    `);
    return rows;
  },

  // ======= SUGERENCIAS =======
  getSugerencias: async () => {
    const [rows] = await db.execute(`
      SELECT 
        p.codigo_producto, 
        p.nombre AS descripcion, 
        p.precio_compra,
        i.cantidad AS existencia, 
        i.stock_minimo AS inv_minimo,
        GREATEST(i.stock_minimo - i.cantidad, 1) AS sugerido
      FROM inventario i
      JOIN productos p ON p.codigo_producto = i.codigo_producto
      WHERE i.cantidad <= i.stock_minimo
      ORDER BY p.nombre
    `);
    return rows;
  },

  // ======= PRODUCTO POR CÓDIGO =======
  getProductoByCodigo: async (codigo) => {
    const [rows] = await db.execute(`
      SELECT codigo_producto, nombre, precio_compra
      FROM productos
      WHERE codigo_producto = ?
    `, [codigo]);
    return rows[0];
  },

  // ======= CREAR =======
  create: async (cabecera, detalles) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const { id_proveedor, fecha_orden, solicitado_por, telefono, comentario } = cabecera;
      const [res] = await conn.execute(`
        INSERT INTO orden_compra 
          (id_proveedor, fecha_orden, solicitado_por, telefono, comentario, estado, total)
        VALUES (?, ?, ?, ?, ?, 'GENERADA', 0)
      `, [id_proveedor, fecha_orden, solicitado_por, telefono, comentario]);
      const id_orden = res.insertId;

      let total = 0;
      for (const d of detalles) {
        const subtotal = Number(d.cantidad) * Number(d.precio_compra);
        total += subtotal;
        await conn.execute(`
          INSERT INTO orden_compra_detalle
          (id_orden, codigo_producto, nombre_producto, cantidad, precio_compra, subtotal)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [id_orden, d.codigo_producto, d.nombre_producto, d.cantidad, d.precio_compra, subtotal]);
      }

      await conn.execute(`UPDATE orden_compra SET total = ? WHERE id_orden = ?`, [total, id_orden]);

      await conn.commit();
      conn.release();
      return { id_orden };
    } catch (e) {
      await conn.rollback();
      conn.release();
      throw e;
    }
  },

  // ======= ACTUALIZAR =======
  updateIfGenerada: async (id_orden, cabecera, detalles) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [[row]] = await conn.execute(
        `SELECT estado FROM orden_compra WHERE id_orden = ? FOR UPDATE`,
        [id_orden]
      );

      if (!row) throw new Error('Orden no existe');
      if (row.estado !== 'GENERADA') throw new Error('Solo se puede editar órdenes GENERADAS');

      const { id_proveedor, fecha_orden, solicitado_por, telefono, comentario } = cabecera;
      await conn.execute(`
        UPDATE orden_compra
        SET id_proveedor = ?, fecha_orden = ?, solicitado_por = ?, telefono = ?, comentario = ?
        WHERE id_orden = ?
      `, [id_proveedor, fecha_orden, solicitado_por, telefono, comentario, id_orden]);

      await conn.execute(`DELETE FROM orden_compra_detalle WHERE id_orden = ?`, [id_orden]);

      let total = 0;
      for (const d of detalles) {
        const subtotal = Number(d.cantidad) * Number(d.precio_compra);
        total += subtotal;
        await conn.execute(`
          INSERT INTO orden_compra_detalle
          (id_orden, codigo_producto, nombre_producto, cantidad, precio_compra, subtotal)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [id_orden, d.codigo_producto, d.nombre_producto, d.cantidad, d.precio_compra, subtotal]);
      }

      await conn.execute(`UPDATE orden_compra SET total = ? WHERE id_orden = ?`, [total, id_orden]);

      await conn.commit();
      conn.release();
    } catch (e) {
      await conn.rollback();
      conn.release();
      throw e;
    }
  },

  // ======= CAMBIAR ESTADO =======
  setEstado: async (id_orden, nuevoEstado) => {
    await db.execute(
      `UPDATE orden_compra SET estado = ? WHERE id_orden = ?`,
      [nuevoEstado, id_orden]
    );
  },

  // ======= ELIMINAR =======
  deleteIfGenerada: async (id_orden) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [[row]] = await conn.execute(
        `SELECT estado FROM orden_compra WHERE id_orden = ?`,
        [id_orden]
      );
      if (!row) throw new Error('Orden no existe');
      if (row.estado !== 'GENERADA')
        throw new Error('No se puede eliminar (estado no GENERADA)');

      await conn.execute(`DELETE FROM orden_compra_detalle WHERE id_orden = ?`, [id_orden]);
      await conn.execute(`DELETE FROM orden_compra WHERE id_orden = ?`, [id_orden]);

      await conn.commit();
      conn.release();
    } catch (e) {
      await conn.rollback();
      conn.release();
      throw e;
    }
  }
};

export default OrdenCompraModel;

