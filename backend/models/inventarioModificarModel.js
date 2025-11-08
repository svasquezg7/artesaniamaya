import db from '../config/db.js';

const InventarioModificarModel = {
  getAll: async () => {
    const [rows] = await db.execute(`
      SELECT i.*, p.nombre AS nombre_producto
      FROM inventario i
      LEFT JOIN productos p ON i.codigo_producto = p.codigo_producto
      ORDER BY i.id_inventario DESC
    `);
    return rows;
  },

  findByCodigo: async (codigo_producto) => {
    const [rows] = await db.execute(
      `SELECT i.*, p.nombre AS nombre_producto
       FROM inventario i
       LEFT JOIN productos p ON i.codigo_producto = p.codigo_producto
       WHERE i.codigo_producto = ?`,
      [codigo_producto]
    );
    return rows[0];
  },

  update: async ({ codigo_producto, cantidad, stock_minimo }) => {
    await db.execute(
      `UPDATE inventario
       SET cantidad = ?, stock_minimo = ?
       WHERE codigo_producto = ?`,
      [cantidad, stock_minimo, codigo_producto]
    );
  }
};

export default InventarioModificarModel;
