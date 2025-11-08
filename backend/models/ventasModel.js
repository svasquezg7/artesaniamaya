// backend/models/ventasModel.js
import db from '../config/db.js';

// Cambia a false si NO quieres vender sin stock
const ALLOW_NEGATIVE_STOCK = false;

const VentasModel = {
  // Crea venta; soporta opcionalmente body.pagos = [] para registrar de una vez
  create: async (body)=>{
    const conn = await db.getConnection();
    try{
      const detalles = Array.isArray(body?.detalles) ? body.detalles : [];
      if(!detalles.length) throw new Error('La venta no tiene productos');

      await conn.beginTransaction();

      const [ins] = await conn.execute(
        `INSERT INTO venta (cajero,id_cliente,notas,total,estado)
         VALUES (?,?,?,0,'EMITIDA')`,
        [body?.cajero||null, body?.id_cliente||null, body?.notas||null]
      );
      const id_venta = ins.insertId;

      let total = 0;
      for (const d of detalles) {
        const codigo = String(d.codigo_producto||'').trim();
        const nombre = String(d.nombre_producto||'').trim();
        const cant   = Number(d.cantidad||0);
        const precio = Number(d.precio_venta||0);
        const desc   = Number(d.descuento||0);
        const comun  = d.es_comun ? 1 : 0;

        if(!codigo || !nombre || cant<=0) throw new Error('Detalle inválido');

        await conn.execute(
          `INSERT INTO venta_detalle (id_venta,codigo_producto,nombre_producto,cantidad,precio_venta,descuento,es_comun)
           VALUES (?,?,?,?,?,?,?)`,
          [id_venta, codigo, nombre, cant, precio, desc, comun]
        );

        if (!comun) {
          const [[inv]] = await conn.execute(
            `SELECT cantidad FROM inventario WHERE codigo_producto=? FOR UPDATE`, [codigo]
          );
          if (!inv) {
            await conn.execute(
              `INSERT INTO inventario (codigo_producto,cantidad,stock_minimo)
               VALUES (?,?,0)`,
              [codigo, 0]
            );
          } else if (!ALLOW_NEGATIVE_STOCK && Number(inv.cantidad) < cant) {
            throw new Error(`Stock insuficiente (${codigo})`);
          }
          await conn.execute(
            `UPDATE inventario SET cantidad=cantidad-? WHERE codigo_producto=?`,
            [cant, codigo]
          );
        }

        total += cant*precio - desc;
      }

      await conn.execute(`UPDATE venta SET total=? WHERE id_venta=?`, [total, id_venta]);

      // ====== NUEVO: registrar pagos si vienen en body.pagos (opcional) ======
      if (Array.isArray(body?.pagos) && body.pagos.length) {
        for (const p of body.pagos) {
          const metodo = String(p?.metodo||'').toUpperCase();
          const monto_q = Number(p?.monto_q||0);
          const monto_usd = Number(p?.monto_usd||0);
          const tc_usd = Number(p?.tc_usd||0);
          const referencia = p?.referencia || null;
          // Validación rápida
          if (!['EFECTIVO','TARJETA','DOLARES'].includes(metodo)) {
            throw new Error('Método de pago inválido');
          }
          if (metodo === 'DOLARES') {
            if (!(monto_usd >= 0) || !(tc_usd > 0)) {
              throw new Error('Pago en dólares inválido (monto_usd/tc_usd)');
            }
          } else {
            if (!(monto_q >= 0)) throw new Error('Monto en Q inválido');
          }

          await conn.execute(
            `INSERT INTO venta_pago (id_venta,metodo,monto_q,monto_usd,tc_usd,referencia)
             VALUES (?,?,?,?,?,?)`,
            [id_venta, metodo, monto_q, monto_usd, tc_usd, referencia]
          );
        }
      }

      await conn.commit(); conn.release();
      return { id_venta, total };
    } catch (e) {
      await conn.rollback(); conn.release(); throw e;
    }
  },

  getById: async (id)=>{
    const [[cab]] = await db.execute(
      `SELECT id_venta, DATE_FORMAT(fecha,'%Y-%m-%d %H:%i') AS fecha, cajero, id_cliente, total, estado, notas
         FROM venta WHERE id_venta=?`, [id]);
    if (!cab) return null;

    const [det] = await db.execute(
      `SELECT id_detalle, codigo_producto, nombre_producto, cantidad, cantidad_devuelta, precio_venta, descuento,
              es_comun, (cantidad*precio_venta - descuento) AS importe
         FROM venta_detalle WHERE id_venta=? ORDER BY id_detalle`, [id]);

    // Pagos asociados
    const [pagos] = await db.execute(
      `SELECT id_pago, metodo, monto_q, monto_usd, tc_usd, referencia,
              DATE_FORMAT(creado_en,'%Y-%m-%d %H:%i') AS creado_en
         FROM venta_pago WHERE id_venta=? ORDER BY id_pago`, [id]);

    return { cabecera: cab, detalles: det, pagos };
  },

  listByDate: async (fecha)=>{
    const [rows] = await db.execute(`
      SELECT id_venta, DATE_FORMAT(fecha,'%H:%i') AS hora, cajero, total, estado
        FROM venta
       WHERE DATE(fecha) = COALESCE(NULLIF(?,''), CURDATE())
       ORDER BY id_venta DESC`, [fecha]);
    return rows;
  },

  returnItem: async (id_venta, id_detalle, cant)=>{
    const conn = await db.getConnection();
    try{
      await conn.beginTransaction();
      const [[d]] = await conn.execute(
        `SELECT * FROM venta_detalle WHERE id_detalle=? AND id_venta=? FOR UPDATE`,
        [id_detalle, id_venta]
      );
      if (!d) throw new Error('Detalle no existe');
      const pendiente = Number(d.cantidad) - Number(d.cantidad_devuelta);
      if (cant <= 0 || cant > pendiente) throw new Error('Cantidad inválida');

      if (!d.es_comun) {
        await conn.execute(
          `UPDATE inventario SET cantidad=cantidad+? WHERE codigo_producto=?`,
          [cant, d.codigo_producto]
        );
      }

      await conn.execute(
        `UPDATE venta_detalle SET cantidad_devuelta=cantidad_devuelta+? WHERE id_detalle=?`,
        [cant, id_detalle]
      );

      await conn.execute(
        `UPDATE venta SET total=total-? WHERE id_venta=?`,
        [cant * Number(d.precio_venta), id_venta]
      );

      await conn.commit(); conn.release();
    } catch (e) { await conn.rollback(); conn.release(); throw e; }
  },

  cancel: async (id_venta)=>{
    const conn = await db.getConnection();
    try{
      await conn.beginTransaction();
      const [det] = await conn.execute(
        `SELECT codigo_producto, es_comun, (cantidad-cantidad_devuelta) AS por_devolver
           FROM venta_detalle WHERE id_venta=? FOR UPDATE`, [id_venta]);

      for (const r of det) {
        const porDevolver = Number(r.por_devolver);
        if (!r.es_comun && porDevolver > 0) {
          await conn.execute(
            `UPDATE inventario SET cantidad=cantidad+? WHERE codigo_producto=?`,
            [porDevolver, r.codigo_producto]
          );
        }
      }

      await conn.execute(`UPDATE venta SET estado='ANULADA', total=0 WHERE id_venta=?`, [id_venta]);
      await conn.commit(); conn.release();
    } catch (e) { await conn.rollback(); conn.release(); throw e; }
  },

  /* ========= NUEVO: pagos ========= */

  addPago: async (id_venta, { metodo, monto_q = 0, monto_usd = 0, tc_usd = 0, referencia = null })=>{
    const M = String(metodo||'').toUpperCase();
    if (!['EFECTIVO','TARJETA','DOLARES'].includes(M)) throw new Error('Método de pago inválido');

    if (M === 'DOLARES') {
      if (!(Number(monto_usd) >= 0) || !(Number(tc_usd) > 0)) {
        throw new Error('Pago en dólares inválido (monto_usd/tc_usd)');
      }
    } else {
      if (!(Number(monto_q) >= 0)) throw new Error('Monto en Q inválido');
    }

    const [r] = await db.execute(
      `INSERT INTO venta_pago (id_venta,metodo,monto_q,monto_usd,tc_usd,referencia) VALUES (?,?,?,?,?,?)`,
      [id_venta, M, Number(monto_q||0), Number(monto_usd||0), Number(tc_usd||0), referencia]
    );
    return r.insertId;
  },

  listPagos: async (id_venta)=>{
    const [rows] = await db.execute(
      `SELECT id_pago, metodo, monto_q, monto_usd, tc_usd, referencia,
              DATE_FORMAT(creado_en,'%Y-%m-%d %H:%i') AS creado_en
         FROM venta_pago WHERE id_venta=? ORDER BY id_pago`, [id_venta]);
    return rows;
  },
  

  //Update
updateDetail: async (id_venta, id_detalle, { cantidad, precio_venta, descuento }) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[venta]] = await conn.execute(
      `SELECT estado, total FROM venta WHERE id_venta=? FOR UPDATE`, [id_venta]);
    if (!venta) throw new Error('Venta no existe');
    if (venta.estado === 'ANULADA') throw new Error('La venta está anulada');

    const totalAntes = Number(venta.total || 0);

    const [[d]] = await conn.execute(
      `SELECT id_detalle,codigo_producto,es_comun,cantidad,precio_venta,descuento
         FROM venta_detalle
        WHERE id_detalle=? AND id_venta=? FOR UPDATE`,
      [id_detalle, id_venta]
    );
    if (!d) throw new Error('Detalle no existe');

    const nuevaCant = (cantidad !== undefined) ? Number(cantidad) : Number(d.cantidad);
    const nuevoPrecio = (precio_venta !== undefined) ? Number(precio_venta) : Number(d.precio_venta);
    const nuevoDesc = (descuento !== undefined) ? Number(descuento) : Number(d.descuento);

    if (nuevaCant <= 0) throw new Error('Cantidad inválida');

    // Ajuste inventario por delta de cantidad
    if (!d.es_comun) {
      const delta = nuevaCant - Number(d.cantidad); // + aumenta venta (consume stock)
      if (delta !== 0) {
        const [[inv]] = await conn.execute(
          `SELECT cantidad FROM inventario WHERE codigo_producto=? FOR UPDATE`, [d.codigo_producto]);
        const stockActual = Number(inv?.cantidad || 0);
        if (delta > 0 && stockActual < delta) {
          throw new Error(`Stock insuficiente (${d.codigo_producto})`);
        }
        await conn.execute(
          `UPDATE inventario SET cantidad=cantidad-? WHERE codigo_producto=?`,
          [delta, d.codigo_producto]
        );
      }
    }

    await conn.execute(
      `UPDATE venta_detalle SET cantidad=?, precio_venta=?, descuento=? WHERE id_detalle=?`,
      [nuevaCant, nuevoPrecio, nuevoDesc, id_detalle]
    );

    const [[t]] = await conn.execute(
      `SELECT COALESCE(SUM((cantidad*precio_venta) - descuento),0) AS total
         FROM venta_detalle WHERE id_venta=?`, [id_venta]);
    const totalDespues = Number(t.total || 0);

    await conn.execute(`UPDATE venta SET total=? WHERE id_venta=?`, [totalDespues, id_venta]);

    // Movimiento de caja por diferencia
    const diferencia = totalDespues - totalAntes;
    if (diferencia !== 0) {
      const tipo = (diferencia > 0) ? 'ENTRADA' : 'SALIDA';
      await conn.execute(
        `INSERT INTO caja_mov (tipo,monto,comentario,cajero)
         VALUES (?,?,CONCAT('Ajuste edición venta #',?), 'CAJERO_1')`,
        [tipo, Math.abs(diferencia), id_venta]
      );
    }

    await conn.commit(); conn.release();
    return { id_venta, id_detalle, total: totalDespues };
  } catch (e) {
    await conn.rollback(); conn.release();
    throw e;
  }
},


};







export default VentasModel;
