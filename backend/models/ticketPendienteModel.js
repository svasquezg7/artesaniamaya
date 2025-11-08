import db from '../config/db.js';

const TicketPendienteModel = {
  list: async () => {
    const [rows] = await db.execute(`
      SELECT id_ticket, nombre, DATE_FORMAT(creado_en,'%Y-%m-%d %H:%i') AS creado_en
        FROM ticket_pendiente ORDER BY id_ticket DESC`);
    return rows;
  },

  getById: async (id_ticket) => {
    const [[cab]] = await db.execute(
      `SELECT id_ticket, nombre, DATE_FORMAT(creado_en,'%Y-%m-%d %H:%i') AS creado_en
         FROM ticket_pendiente WHERE id_ticket=?`, [id_ticket]);
    if (!cab) return null;
    const [det] = await db.execute(
      `SELECT codigo_producto, nombre_producto, cantidad, precio_venta, descuento, existencia
         FROM ticket_pendiente_detalle WHERE id_ticket=? ORDER BY id_detalle`, [id_ticket]);
    return { cabecera: cab, detalles: det };
  },

  create: async (nombre, detalles) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [ins] = await conn.execute(`INSERT INTO ticket_pendiente (nombre) VALUES (?)`, [nombre]);
      const id_ticket = ins.insertId;

      for (const d of detalles) {
        await conn.execute(
          `INSERT INTO ticket_pendiente_detalle
           (id_ticket,codigo_producto,nombre_producto,cantidad,precio_venta,descuento,existencia)
           VALUES (?,?,?,?,?,?,?)`,
          [
            id_ticket,
            String(d.codigo_producto || '').trim(),
            d.nombre_producto || '',
            Number(d.cantidad || 0),
            Number(d.precio_venta || 0),
            Number(d.descuento || 0),
            d.existencia ?? null
          ]
        );
      }
      await conn.commit(); conn.release();
      return id_ticket;
    } catch (e) { await conn.rollback(); conn.release(); throw e; }
  },

  update: async (id_ticket, nombre, detalles) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      if (nombre?.trim()) {
        await conn.execute(`UPDATE ticket_pendiente SET nombre=? WHERE id_ticket=?`, [nombre.trim(), id_ticket]);
      }
      await conn.execute(`DELETE FROM ticket_pendiente_detalle WHERE id_ticket=?`, [id_ticket]);
      for (const d of (detalles || [])) {
        await conn.execute(
          `INSERT INTO ticket_pendiente_detalle
           (id_ticket,codigo_producto,nombre_producto,cantidad,precio_venta,descuento,existencia)
           VALUES (?,?,?,?,?,?,?)`,
          [
            id_ticket,
            String(d.codigo_producto || '').trim(),
            d.nombre_producto || '',
            Number(d.cantidad || 0),
            Number(d.precio_venta || 0),
            Number(d.descuento || 0),
            d.existencia ?? null
          ]
        );
      }
      await conn.commit(); conn.release();
    } catch (e) { await conn.rollback(); conn.release(); throw e; }
  },

  remove: async (id_ticket) => {
    await db.execute(`DELETE FROM ticket_pendiente WHERE id_ticket=?`, [id_ticket]);
  }
};

export default TicketPendienteModel;
