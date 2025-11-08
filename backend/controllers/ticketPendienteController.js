import TicketPendienteModel from '../models/ticketPendienteModel.js';

export const listarTickets = async (_req, res) => {
  try { res.json(await TicketPendienteModel.list()); }
  catch (e) { res.status(500).json({ message: e.message || 'Error al listar' }); }
};

export const obtenerTicket = async (req, res) => {
  try {
    const t = await TicketPendienteModel.getById(req.params.id);
    if (!t) return res.status(404).json({ message: 'No existe' });
    res.json(t);
  } catch (e) { res.status(500).json({ message: e.message || 'Error' }); }
};

export const crearTicket = async (req, res) => {
  try {
    const { nombre, detalles } = req.body || {};
    if (!nombre?.trim() || !Array.isArray(detalles) || !detalles.length)
      return res.status(400).json({ message: 'Nombre y detalles requeridos' });
    const id_ticket = await TicketPendienteModel.create(nombre.trim(), detalles);
    res.json({ message: 'Ticket creado', id_ticket });
  } catch (e) { res.status(400).json({ message: e.message || 'Error al crear' }); }
};

export const actualizarTicket = async (req, res) => {
  try {
    const { nombre, detalles } = req.body || {};
    await TicketPendienteModel.update(req.params.id, nombre, detalles);
    res.json({ message: 'Ticket actualizado' });
  } catch (e) { res.status(400).json({ message: e.message || 'Error al actualizar' }); }
};

export const eliminarTicket = async (req, res) => {
  try {
    await TicketPendienteModel.remove(req.params.id);
    res.json({ message: 'Ticket eliminado' });
  } catch (e) { res.status(400).json({ message: e.message || 'Error al eliminar' }); }
};
