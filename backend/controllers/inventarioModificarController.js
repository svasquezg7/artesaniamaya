import InventarioModificarModel from '../models/inventarioModificarModel.js';

// Obtener todo el inventario
export const getInventario = async (req, res) => {
  try {
    const data = await InventarioModificarModel.getAll();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener inventario', error });
  }
};

// Buscar producto por código
export const buscarPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;
    const producto = await InventarioModificarModel.findByCodigo(codigo);
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(producto);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar producto', error });
  }
};

// Actualizar inventario
export const actualizarInventario = async (req, res) => {
  try {
    const { codigo_producto, cantidad, stock_minimo } = req.body;
    await InventarioModificarModel.update({ codigo_producto, cantidad, stock_minimo });
    res.json({ message: 'Inventario actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar inventario', error });
  }
};
