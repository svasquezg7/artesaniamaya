import { Router } from 'express';
import {
  crearTicket, listarTickets, obtenerTicket, actualizarTicket, eliminarTicket
} from '../controllers/ticketPendienteController.js';

const r = Router();
r.get('/', listarTickets);
r.get('/:id', obtenerTicket);
r.post('/', crearTicket);
r.put('/:id', actualizarTicket);
r.delete('/:id', eliminarTicket);
export default r;
