import db from '../config/db.js';

const ProductoModel = {
  // ==== LISTAR TODO (con categoría) ====
  getAll: async () => {
    const [rows] = await db.execute(`
      SELECT p.*, c.nombre_categoria
      FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      ORDER BY p.id_producto DESC
    `);
    return rows;
  },

  // ==== CREAR ====
  create: async (data) => {
    const { codigo_producto, nombre, id_categoria, precio_compra, precio_venta, ganancia } = data;
    await db.execute(
      `INSERT INTO productos 
       (codigo_producto, nombre, id_categoria, precio_compra, precio_venta, ganancia)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [codigo_producto, nombre, id_categoria, precio_compra, precio_venta, ganancia]
    );
  },

  // ==== ACTUALIZAR ====
  update: async (id, data) => {
    const { codigo_producto, nombre, id_categoria, precio_compra, precio_venta, ganancia } = data;
    await db.execute(
      `UPDATE productos
          SET codigo_producto=?, nombre=?, id_categoria=?, 
              precio_compra=?, precio_venta=?, ganancia=?
        WHERE id_producto=?`,
      [codigo_producto, nombre, id_categoria, precio_compra, precio_venta, ganancia, id]
    );
  },

  // ==== ELIMINAR ====
  delete: async (id) => {
    await db.execute('DELETE FROM productos WHERE id_producto=?', [id]);
  },

  // ==== POS: Buscar por nombre o código (incluye existencia y costo) ====
  search: async (term) => {
    const like = `%${term}%`;
    const [rows] = await db.execute(
      `
      SELECT p.codigo_producto,
             p.nombre,
             p.precio_venta,
             p.precio_compra,                -- ✅ costo
             COALESCE(i.cantidad, 0) AS existencia
        FROM productos p
        LEFT JOIN inventario i ON i.codigo_producto = p.codigo_producto
       WHERE p.codigo_producto LIKE ? OR p.nombre LIKE ?
       ORDER BY p.nombre
       LIMIT 200
      `,
      [like, like]
    );
    return rows;
  },

  // ==== POS: Buscar EXACTO por código (incluye existencia y costo) ====
  findByCodigoWithExistencia: async (codigo) => {
    const [rows] = await db.execute(
      `
      SELECT p.codigo_producto,
             p.nombre,
             p.precio_venta,
             p.precio_compra,                -- ✅ costo
             COALESCE(i.cantidad, 0) AS existencia
        FROM productos p
        LEFT JOIN inventario i ON i.codigo_producto = p.codigo_producto
       WHERE p.codigo_producto = ?
       LIMIT 1
      `,
      [codigo]
    );
    return rows[0];
  }
};

export default ProductoModel;

