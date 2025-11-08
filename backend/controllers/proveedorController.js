import ProveedorModel from '../models/proveedorModel.js';

export const getProveedores = async (_req, res) => {
  try {
    const rows = await ProveedorModel.getAll();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message || 'Error al listar proveedores' });
  }
};

export const createProveedor = async (req, res) => {
  try {
    const data = req.body;
    if (!data.nombre || !data.nombre.trim()) {
      return res.status(400).json({ message: 'El nombre es obligatorio' });
    }
    const id = await ProveedorModel.create(data);
    res.status(201).json({ message: 'Proveedor creado correctamente', id_proveedor: id });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Error al crear proveedor' });
  }
};

export const updateProveedor = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await ProveedorModel.update(id, req.body);
    res.json({ message: 'Proveedor actualizado correctamente' });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Error al actualizar proveedor' });
  }
};

export const deleteProveedor = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await ProveedorModel.delete(id);
    res.json({ message: 'Proveedor eliminado correctamente' });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Error al eliminar proveedor' });
  }
};

export const buscarProveedores = async (req, res) => {
  try {
    const term = String(req.params.term || '').trim();
    if (!term) return res.json([]);
    const rows = await ProveedorModel.search(term);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message || 'Error al buscar proveedores' });
  }
};
