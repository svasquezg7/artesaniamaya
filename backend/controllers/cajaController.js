// backend/controllers/cajaController.js
import CajaModel from '../models/cajaModel.js';

/* =========================
 *  MOVIMIENTOS (ENT/SAL)
 * ========================= */
export const crearMovimiento = async (req, res) => {
  try {
    // body: { tipo, monto, comentario?, cajero?, id_turno? }
    const id = await CajaModel.addMovimiento(req.body || {});
    res.json({ message: 'Movimiento registrado', id });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Error' });
  }
};

export const listarMovimientos = async (req, res) => {
  try {
    const { desde = '', hasta = '', id_turno = '' } = req.query || {};
    const rows = await CajaModel.listMovimientos({
      desde: String(desde),
      hasta: String(hasta),
      id_turno: String(id_turno)
    });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message || 'Error' });
  }
};

/* =========================
 *  TURNOS (estado/abrir/resumen/cerrar)
 * ========================= */

/**
 * GET /api/caja/estado?cajero=USER
 * - Si hay turno ABIERTO: { abierto:true, turno, resumen }
 * - Si NO hay:           { abierto:false }
 */
export const estadoActual = async (req, res) => {
  try {
    const cajero = String(req.query.cajero || '').trim();
    if (!cajero) return res.status(400).json({ message: 'Falta cajero' });

    const turno = await CajaModel.getTurnoAbierto(cajero);
    if (!turno) return res.json({ abierto: false });

    const resumen = await CajaModel.resumenTurno(turno.id_turno);
    res.json({ abierto: true, turno, resumen });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Error' });
  }
};

/**
 * POST /api/caja/abrir
 * body: { cajero, fondo_inicial, comentario? }
 * - Verifica que no exista ya un turno ABIERTO para ese cajero
 * - Crea el turno y movimiento APERTURA
 */
export const abrirTurno = async (req, res) => {
  try {
    const { cajero, fondo_inicial, comentario = null } = req.body || {};
    if (!cajero || isNaN(Number(fondo_inicial))) {
      return res.status(400).json({ message: 'Datos inválidos (cajero / fondo_inicial)' });
    }

    const ya = await CajaModel.getTurnoAbierto(cajero);
    if (ya) return res.status(400).json({ message: 'Ya existe un turno abierto para este cajero' });

    const id_turno = await CajaModel.abrirTurno({
      cajero,
      fondo_inicial: Number(fondo_inicial),
      comentario
    });

    res.json({ message: 'Turno abierto', id_turno });
  } catch (e) {
    res.status(400).json({ message: e.message || 'No se pudo abrir turno' });
  }
};

/**
 * GET /api/caja/resumen/:id_turno
 * - Devuelve desglose (fondo, entradas, salidas, esperado, etc.)
 */
export const resumenTurno = async (req, res) => {
  try {
    const id_turno = Number(req.params.id_turno);
    if (!id_turno) return res.status(400).json({ message: 'id_turno inválido' });

    const resumen = await CajaModel.resumenTurno(id_turno);
    res.json(resumen);
  } catch (e) {
    res.status(500).json({ message: e.message || 'Error' });
  }
};

/**
 * POST /api/caja/cerrar
 * body: { id_turno, efectivo_contado, comentario? }
 * - Calcula esperado, registra CIERRE y marca turno CERRADO
 */
export const cerrarTurno = async (req, res) => {
  try {
    const { id_turno, efectivo_contado, comentario = null } = req.body || {};
    if (!id_turno || isNaN(Number(efectivo_contado))) {
      return res.status(400).json({ message: 'Datos inválidos (id_turno / efectivo_contado)' });
    }

    const info = await CajaModel.cerrarTurno({
      id_turno: Number(id_turno),
      efectivo_contado: Number(efectivo_contado),
      comentario
    });

    res.json({ message: 'Turno cerrado', ...info });
  } catch (e) {
    res.status(400).json({ message: e.message || 'No se pudo cerrar turno' });
  }
};
