import { Router } from 'express';
import {
  buscarVentas,
  obtenerVentaDetallada,
  devolucionesDeVenta,
  listarCajeros,
    pagosDeVenta, // <-- NUEVO

} from '../controllers/ventasHistorialController.js';

const r = Router();

r.get('/', buscarVentas);                 // ?q&fecha&cajero
r.get('/cajeros', listarCajeros);         // lista cajeros/usuarios activos
r.get('/:id', obtenerVentaDetallada);     // cabecera + detalle
r.get('/:id/devoluciones', devolucionesDeVenta);
r.get('/:id/pagos', pagosDeVenta);  // <-- NUEVO

export default r;
