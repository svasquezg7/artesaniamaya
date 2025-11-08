import OrdenCompraModel from '../models/ordenCompraModel.js';


// ==== FUNCIONES EXISTENTES (NO MODIFICADAS) ====
export const listar = async (_req, res) => {
  try { res.json(await OrdenCompraModel.list()); }
  catch (e) { res.status(500).json({ message: 'Error al listar', error: e }); }
};

export const obtener = async (req, res) => {
  try { res.json(await OrdenCompraModel.getById(req.params.id)); }
  catch (e) { res.status(500).json({ message: 'Error al obtener', error: e }); }
};

export const listarProveedores = async (_req, res) => {
  try { res.json(await OrdenCompraModel.getProveedores()); }
  catch (e) { res.status(500).json({ message: 'Error proveedores', error: e }); }
};

export const listarSugerencias = async (_req, res) => {
  try { res.json(await OrdenCompraModel.getSugerencias()); }
  catch (e) { res.status(500).json({ message: 'Error sugerencias', error: e }); }
};

export const productoPorCodigo = async (req, res) => {
  try {
    const p = await OrdenCompraModel.getProductoByCodigo(req.params.codigo);
    if (!p) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(p);
  } catch (e) { res.status(500).json({ message: 'Error producto', error: e }); }
};

export const crear = async (req, res) => {
  try {
    const { cabecera, detalles } = req.body;
    const { id_orden } = await OrdenCompraModel.create(cabecera, detalles);
    res.json({ message: 'Orden creada', id_orden });
  } catch (e) { res.status(500).json({ message: 'Error al crear', error: e }); }
};

export const actualizar = async (req, res) => {
  try {
    const { cabecera, detalles } = req.body;
    await OrdenCompraModel.updateIfGenerada(req.params.id, cabecera, detalles);
    res.json({ message: 'Orden actualizada' });
  } catch (e) { res.status(400).json({ message: e.message || 'Error al actualizar' }); }
};

export const cambiarEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    await OrdenCompraModel.setEstado(req.params.id, estado);
    res.json({ message: `Estado actualizado a ${estado}` });
  } catch (e) { res.status(500).json({ message: 'Error al cambiar estado', error: e }); }
};

export const eliminar = async (req, res) => {
  try {
    await OrdenCompraModel.deleteIfGenerada(req.params.id);
    res.json({ message: 'Orden eliminada' });
  } catch (e) { res.status(400).json({ message: e.message || 'Error al eliminar' }); }
};

// ==== NUEVAS FUNCIONES ====

export const obtenerConDetalle = async (req, res) => {
  try {
    const orden = await OrdenCompraModel.getWithDetalle(req.params.id);
    if (!orden) return res.status(404).json({ message: 'Orden no encontrada' });
    res.json(orden);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener detalle de orden', error: e });
  }
};