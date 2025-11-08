import db from '../config/db.js';

const InventarioModel = {
  getAll: async () => {
    const [rows] = await db.execute(`
      SELECT i.*, p.nombre AS nombre_producto
      FROM inventario i
      LEFT JOIN productos p ON i.codigo_producto = p.codigo_producto
      ORDER BY i.id_inventario DESC
    `);
    return rows;
  },

  // ✅ Buscar producto por código
  findByCodigo: async (codigo_producto) => {
    const [rows] = await db.execute(
      'SELECT * FROM productos WHERE codigo_producto = ?',
      [codigo_producto]
    );
    return rows[0];
  },

  // ✅ Verificar si el producto ya está en inventario
  findInventarioByCodigo: async (codigo_producto) => {
    const [rows] = await db.execute(
      'SELECT * FROM inventario WHERE codigo_producto = ?',
      [codigo_producto]
    );
    return rows[0];
  },

  // ✅ Agregar cantidad si ya existe
  addCantidad: async (codigo_producto, cantidad) => {
    await db.execute(
      'UPDATE inventario SET cantidad = cantidad + ? WHERE codigo_producto = ?',
      [cantidad, codigo_producto]
    );
  },

  // ✅ Crear nuevo registro en inventario
  create: async ({ codigo_producto, nombre_producto, cantidad, stock_minimo }) => {
    await db.execute(
      `INSERT INTO inventario (codigo_producto, nombre_producto, cantidad, stock_minimo)
       VALUES (?, ?, ?, ?)`,
      [codigo_producto, nombre_producto, cantidad, stock_minimo]
    );
  }
};

export default InventarioModel;
