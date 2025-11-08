import ProductoModel from '../models/productoModel.js';

export const getProductos = async (_req, res) => {
  try {
    const productos = await ProductoModel.getAll();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos', error });
  }
};

export const createProducto = async (req, res) => {
  try {
    await ProductoModel.create(req.body);
    res.json({ message: 'Producto creado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear producto', error });
  }
};

export const updateProducto = async (req, res) => {
  try {
    await ProductoModel.update(req.params.id, req.body);
    res.json({ message: 'Producto actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar producto', error });
  }
};

export const deleteProducto = async (req, res) => {
  try {
    await ProductoModel.delete(req.params.id);
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar producto', error });
  }
};

// ==== POS: BÚSQUEDA Y OBTENER POR CÓDIGO ====
export const buscarProductos = async (req, res) => {
  try {
    const term = String(req.params.term || '').trim();
    if (!term) return res.json([]);
    const rows = await ProductoModel.search(term);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error de búsqueda', error });
  }
};

export const getProductoByCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;
    const producto = await ProductoModel.findByCodigoWithExistencia(codigo);
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(producto);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar producto', error });
  }
};
