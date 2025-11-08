// backend/controllers/ventasController.js
import VentasModel from '../models/ventasModel.js';

export const crearVenta = async (req, res) => {
  try {
    const r = await VentasModel.create(req.body);
    res.json({ message: 'Venta emitida', ...r });
  } catch (e) {
    res.status(400).json({ message: e.message || 'No se pudo cobrar' });
  }
};

export const obtenerVenta = async (req, res) => {
  try {
    const v = await VentasModel.getById(Number(req.params.id));
    if (!v) return res.status(404).json({ message: 'Venta no encontrada' });
    res.json(v);
  } catch (e) {
    res.status(500).json({ message: e.message || 'Error' });
  }
};

export const ventasDelDia = async (req, res) => {
  try {
    res.json(await VentasModel.listByDate(String(req.query.fecha || '')));
  } catch (e) {
    res.status(500).json({ message: e.message || 'Error' });
  }
};

export const devolverItem = async (req, res) => {
  try {
    await VentasModel.returnItem(
      Number(req.params.id),
      Number(req.body?.id_detalle),
      Number(req.body?.cantidad)
    );
    res.json({ message: 'Devolución registrada' });
  } catch (e) {
    res.status(400).json({ message: e.message || 'No se pudo devolver' });
  }
};

export const anularVenta = async (req, res) => {
  try {
    await VentasModel.cancel(Number(req.params.id));
    res.json({ message: 'Venta anulada' });
  } catch (e) {
    res.status(400).json({ message: e.message || 'No se pudo anular' });
  }
};

/* ========= NUEVO: Pagos por venta ========= */
export const agregarPago = async (req, res) => {
  try {
    const id_venta = Number(req.params.id);
    const { metodo, monto_q = 0, monto_usd = 0, tc_usd = 0, referencia = null } = req.body || {};
    const id_pago = await VentasModel.addPago(id_venta, { metodo, monto_q, monto_usd, tc_usd, referencia });
    res.json({ message: 'Pago registrado', id_pago });
  } catch (e) {
    res.status(400).json({ message: e.message || 'No se pudo registrar el pago' });
  }
};

export const listarPagos = async (req, res) => {
  try {
    const id_venta = Number(req.params.id);
    const rows = await VentasModel.listPagos(id_venta);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message || 'Error al listar pagos' });
  }
};


export const actualizarDetalleVenta = async (req, res) => {
  try {
    const id_venta = Number(req.params.id);
    const id_detalle = Number(req.params.id_detalle);
    const { cantidad, precio_venta, descuento } = req.body || {};
    const r = await VentasModel.updateDetail(id_venta, id_detalle, {
      cantidad, precio_venta, descuento
    });
    res.json({ message: 'Detalle actualizado', ...r });
  } catch (e) {
    res.status(400).json({ message: e.message || 'No se pudo actualizar el detalle' });
  }
};