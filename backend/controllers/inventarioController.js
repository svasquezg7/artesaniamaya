import InventarioModel from '../models/inventarioModel.js';

export const getInventario = async (req, res) => {
  try {
    const inventario = await InventarioModel.getAll();
    res.json(inventario);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener inventario', error });
  }
};

// ✅ Buscar producto por código (lector o manual)
export const buscarPorCodigo = async (req, res) => {
  const { codigo } = req.params;
  try {
    const producto = await InventarioModel.findByCodigo(codigo);
    if (!producto)
      return res.status(404).json({ message: 'Producto no encontrado' });

    res.json(producto);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar producto', error });
  }
};

// ✅ Agregar producto o aumentar cantidad
export const agregarInventario = async (req, res) => {
  try {
    const { codigo_producto, cantidad, stock_minimo } = req.body;

    // Buscar si el producto existe
    const producto = await InventarioModel.findByCodigo(codigo_producto);
    if (!producto)
      return res.status(404).json({ message: 'Producto no encontrado en la tabla productos' });

    const existente = await InventarioModel.findInventarioByCodigo(codigo_producto);

    if (existente) {
      // Si ya existe, sumamos la cantidad
      await InventarioModel.addCantidad(codigo_producto, cantidad);
      res.json({ message: 'Cantidad actualizada en inventario' });
    } else {
      // Si no existe, lo creamos
      await InventarioModel.create({
        codigo_producto,
        nombre_producto: producto.nombre,
        cantidad,
        stock_minimo
      });
      res.json({ message: 'Producto agregado al inventario' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al agregar al inventario', error });
  }
};
