// backend/routes/ventasRoutes.js
import { Router } from 'express';
import {
  crearVenta,
  obtenerVenta,
  ventasDelDia,
  devolverItem,
  anularVenta,
  agregarPago,   // ✅ ahora sí existe en el controller
  listarPagos,    // ✅ ahora sí existe en el controller
  actualizarDetalleVenta,   // <-- NUEVO
} from '../controllers/ventasController.js';

const r = Router();

// Ventas
r.post('/', crearVenta);                        // POST  /api/ventas
r.get('/', ventasDelDia);                       // GET   /api/ventas?fecha=YYYY-MM-DD
r.get('/:id', obtenerVenta);                    // GET   /api/ventas/123
r.post('/:id/devolver', devolverItem);          // POST  /api/ventas/123/devolver
r.post('/:id/anular', anularVenta);             // POST  /api/ventas/123/anular

// Pagos por venta (opcional desde el front)
r.post('/:id/pagos', listarPagos);              // OJO: Si quieres listar con GET, cámbialo abajo
r.get('/:id/pagos', listarPagos);               // GET /api/ventas/123/pagos (recomendado)
r.post('/:id/pagos/agregar', agregarPago);      // POST /api/ventas/123/pagos/agregar


r.patch('/:id/detalles/:id_detalle', actualizarDetalleVenta);


export default r;
