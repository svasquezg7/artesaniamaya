// backend/models/cajaModel.js
import db from '../config/db.js';

const num = (v) => (v == null ? 0 : Number(v));

const CajaModel = {
  /* =========================
   *  ESTADO / TURNO ABIERTO
   * ========================= */
  async getTurnoAbierto(cajero) {
    const [rows] = await db.execute(
      `SELECT id_turno, cajero, inicio, fondo_inicial, estado, cierre,
              efectivo_esperado, efectivo_contado, diferencia
         FROM caja_turnos
        WHERE cajero = ? AND estado = 'ABIERTO'
        ORDER BY id_turno DESC
        LIMIT 1`,
      [cajero]
    );
    return rows[0] || null;
  },

  async estadoCaja(cajero) {
    const turno = await this.getTurnoAbierto(cajero);
    if (!turno) return { abierto: false, turno: null };

    const resumen = await this.resumenTurno(turno.id_turno);
    return { abierto: true, turno, resumen };
  },

  /* =========================
   *  APERTURA DE TURNO
   * ========================= */
  async abrirTurno({ cajero, fondo_inicial, comentario = null }) {
    const ya = await this.getTurnoAbierto(cajero);
    if (ya) throw new Error('Ya existe un turno ABIERTO para este cajero');

    const fi = Number(fondo_inicial || 0);
    if (fi < 0) throw new Error('Fondo inicial inválido');

    const [r] = await db.execute(
      `INSERT INTO caja_turnos (cajero, inicio, fondo_inicial, estado, efectivo_esperado, efectivo_contado, diferencia)
       VALUES (?, NOW(), ?, 'ABIERTO', 0, 0, 0)`,
      [cajero, fi]
    );
    const id_turno = r.insertId;

    await db.execute(
      `INSERT INTO caja_movimiento (id_turno, fecha, tipo, monto, comentario, cajero)
       VALUES (?, NOW(), 'APERTURA', ?, ?, ?)`,
      [id_turno, fi, comentario, cajero]
    );

    return id_turno;
  },

  /* =========================
   *  MOVIMIENTOS (ENT/SAL)
   * ========================= */
  async addMovimiento({ tipo, monto, comentario = null, cajero = null, id_turno = null }) {
    const T = String(tipo || '').toUpperCase();
    if (!['ENTRADA', 'SALIDA', 'APERTURA', 'CIERRE'].includes(T)) {
      throw new Error('Tipo inválido');
    }
    const M = Number(monto || 0);
    if (!(M >= 0)) throw new Error('Monto inválido');

    let turnoId = id_turno;
    if (!turnoId && cajero) {
      const abierto = await this.getTurnoAbierto(cajero);
      if (abierto) turnoId = abierto.id_turno;
    }

    const [r] = await db.execute(
      `INSERT INTO caja_movimiento (id_turno, fecha, tipo, monto, comentario, cajero)
       VALUES (?, NOW(), ?, ?, ?, ?)`,
      [turnoId || null, T, M, comentario, cajero]
    );
    return r.insertId;
  },

  async listMovimientos({ desde = '', hasta = '', id_turno = '' }) {
    const [rows] = await db.execute(
      `SELECT id_mov,
              DATE_FORMAT(fecha,'%Y-%m-%d %H:%i') AS fecha,
              id_turno, tipo, monto, comentario, cajero
         FROM caja_movimiento
        WHERE (DATE(fecha) >= COALESCE(NULLIF(?,''), DATE_SUB(CURDATE(), INTERVAL 7 DAY)))
          AND (DATE(fecha) <= COALESCE(NULLIF(?,''), CURDATE()))
          AND (? = '' OR id_turno = ?)
        ORDER BY id_mov DESC`,
      [desde, hasta, String(id_turno || ''), Number(id_turno || 0)]
    );
    return rows;
  },

  /* =========================
   *  HELPERS DE RESUMEN
   * ========================= */

  // Ventas cobradas en EFECTIVO (sólo lo que entra a caja)
  async ventasEfectivoDelTurno({ cajero, inicio, fin }) {
    // Asume: ventas.estado, ventas.cajero, ventas.fecha
    //        ventas_pagos: monto_q (efectivo en quetzales), monto_usd, tc_usd
    const [rows] = await db.execute(
      `SELECT COALESCE(SUM(p.monto_q),0) AS q
         FROM ventas v
         JOIN ventas_pagos p ON p.id_venta = v.id_venta
        WHERE v.cajero = ?
          AND v.estado = 'ACTIVA'
          AND v.fecha >= ?
          AND v.fecha < ?
          -- p.monto_q es la porción en efectivo (incluye pagos mixtos)
      `,
      [cajero, inicio, fin]
    );
    return num(rows[0]?.q);
  },

  // Devoluciones pagadas en EFECTIVO (lo que sale de caja)
  async devolucionesEfectivoDelTurno({ cajero, inicio, fin }) {
    // Opción A: si tienes una tabla de devoluciones con montos en efectivo:
    //   ventas_devoluciones (id, id_venta, fecha, monto_q, cajero, ...).
    // Ajusta el nombre si difiere.
    try {
      const [rows] = await db.execute(
        `SELECT COALESCE(SUM(d.monto_q),0) AS q
           FROM ventas_devoluciones d
          WHERE d.cajero = ?
            AND d.fecha >= ?
            AND d.fecha < ?`,
        [cajero, inicio, fin]
      );
      return num(rows[0]?.q);
    } catch {
      // Opción B (fallback): si no tienes tabla de devoluciones,
      // restamos SALIDAS marcadas como devolución por comentario.
      const [alt] = await db.execute(
        `SELECT COALESCE(SUM(monto),0) AS q
           FROM caja_movimiento
          WHERE cajero = ?
            AND fecha >= ?
            AND fecha < ?
            AND tipo='SALIDA'
            AND (comentario LIKE '%DEVOLUCION%' OR comentario LIKE '%DEVOLUCIÓN%')`,
        [cajero, inicio, fin]
      );
      return num(alt[0]?.q);
    }
  },

  /* =========================
   *  RESUMEN DEL TURNO
   * ========================= */
  async resumenTurno(id_turno) {
    // 1) Turno
    const [t] = await db.execute(
      `SELECT id_turno, cajero, inicio, fondo_inicial, estado, cierre,
              efectivo_esperado, efectivo_contado, diferencia
         FROM caja_turnos
        WHERE id_turno = ?`,
      [id_turno]
    );
    const turno = t[0];
    if (!turno) throw new Error('Turno no encontrado');

    const inicio = turno.inicio;              // DATETIME
    const fin = turno.cierre || new Date();   // hasta ahora si sigue abierto
    const cajero = turno.cajero;

    // 2) Movimientos propios del turno
    const [m] = await db.execute(
      `SELECT
          SUM(CASE WHEN tipo='ENTRADA'  THEN monto ELSE 0 END) AS entradas,
          SUM(CASE WHEN tipo='SALIDA'   THEN monto ELSE 0 END) AS salidas,
          SUM(CASE WHEN tipo='APERTURA' THEN monto ELSE 0 END) AS aperturas,
          SUM(CASE WHEN tipo='CIERRE'   THEN monto ELSE 0 END) AS cierres
         FROM caja_movimiento
        WHERE id_turno = ?`,
      [id_turno]
    );
    const entradas = num(m[0]?.entradas);
    const salidas  = num(m[0]?.salidas);

    // 3) Ventas y devoluciones en EFECTIVO dentro de la ventana del turno
    const ventas_efectivo       = await this.ventasEfectivoDelTurno({ cajero, inicio, fin });
    const devoluciones_efectivo = await this.devolucionesEfectivoDelTurno({ cajero, inicio, fin });

    // 4) Efectivo esperado en caja:
    //    fondo + entradas + ventas_efectivo - salidas - devoluciones_efectivo
    const esperado = Number(turno.fondo_inicial)
                   + ventas_efectivo
                   + entradas
                   - salidas
                   - devoluciones_efectivo;

    return {
      turno: {
        id_turno: turno.id_turno,
        cajero: turno.cajero,
        inicio: turno.inicio,
        estado: turno.estado
      },
      ventas_total: ventas_efectivo,             // efectivo que entró por ventas
      devoluciones_total: devoluciones_efectivo, // efectivo que salió por devoluciones
      entradas,
      salidas,
      efectivo_esperado: esperado
    };
  },

  /* =========================
   *  CIERRE DE TURNO
   * ========================= */
  async cerrarTurno({ id_turno, efectivo_contado, comentario = null }) {
    // Recalcular esperado ya con ventas/devoluciones en EFECTIVO
    const resumen = await this.resumenTurno(id_turno);
    const esperado = Number(resumen.efectivo_esperado);
    const contado  = Number(efectivo_contado || 0);
    const diferencia = contado - esperado;

    const [t] = await db.execute(`SELECT cajero FROM caja_turnos WHERE id_turno = ?`, [id_turno]);
    const cajero = t[0]?.cajero || null;

    await db.execute(
      `INSERT INTO caja_movimiento (id_turno, fecha, tipo, monto, comentario, cajero)
       VALUES (?, NOW(), 'CIERRE', ?, ?, ?)`,
      [id_turno, contado, comentario, cajero]
    );

    await db.execute(
      `UPDATE caja_turnos
          SET estado='CERRADO',
              cierre=NOW(),
              efectivo_esperado=?,
              efectivo_contado=?,
              diferencia=?
        WHERE id_turno = ?`,
      [esperado, contado, diferencia, id_turno]
    );

    return { efectivo_esperado: esperado, efectivo_contado: contado, diferencia };
  }
};

export default CajaModel;
