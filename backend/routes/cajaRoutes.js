// backend/routes/cajaRoutes.js
import { Router } from 'express';
import {
  // Turnos
  estadoActual,     // GET  /estado?cajero=USER
  abrirTurno,       // POST /abrir
  resumenTurno,     // GET  /resumen/:id_turno
  cerrarTurno,      // POST /cerrar

  // Movimientos
  crearMovimiento,  // POST /movimiento  (compat: POST /)
  listarMovimientos // GET  /movimientos (compat: GET /)
} from '../controllers/cajaController.js';

const r = Router();

/* ====== Turnos ====== */
r.get('/estado', estadoActual);
r.post('/abrir', abrirTurno);
r.get('/resumen/:id_turno', resumenTurno);
r.post('/cerrar', cerrarTurno);

/* ====== Movimientos (rutas nuevas y compatibilidad) ====== */
r.post('/movimiento', crearMovimiento);
r.get('/movimientos', listarMovimientos);

// Compatibilidad con versión anterior:
r.post('/', crearMovimiento);   // { tipo:'ENTRADA'|'SALIDA'|'APERTURA'|'CIERRE', monto, comentario?, cajero?, id_turno? }
r.get('/', listarMovimientos);  // ?desde&hasta&id_turno

export default r;