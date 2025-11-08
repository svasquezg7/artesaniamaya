import VentasHistorialModel from '../models/ventasHistorialModel.js';

// GET /api/ventas-historial?q=texto&fecha=YYYY-MM-DD&cajero=USUARIO
export const buscarVentas = async (req, res) => {
  try {
    const { q = '', fecha = '', cajero = '' } = req.query;
    const rows = await VentasHistorialModel.search({ q, fecha, cajero });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message || 'Error al buscar ventas' });
  }
};

// GET /api/ventas-historial/:id
export const obtenerVentaDetallada = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const v = await VentasHistorialModel.getById(id);
    if (!v) return res.status(404).json({ message: 'Venta no encontrada' });
    res.json(v);
  } catch (e) {
    res.status(500).json({ message: e.message || 'Error al obtener la venta' });
  }
};

// GET /api/ventas-historial/:id/devoluciones
export const devolucionesDeVenta = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const rows = await VentasHistorialModel.getReturnsBySale(id);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message || 'Error al obtener devoluciones' });
  }
};

// GET /api/ventas-historial/cajeros
export const listarCajeros = async (_req, res) => {
  try {
    const rows = await VentasHistorialModel.listCashiers();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message || 'Error al listar cajeros' });
  }
};

//
export const pagosDeVenta = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const rows = await VentasModel.listPagos(id);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message || 'Error' });
  }
};
