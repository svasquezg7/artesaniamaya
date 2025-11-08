import db from '../config/db.js';

const ReporteInventarioModel = {
  getReporte: async (categoriaId = null) => {
    let query = `
      SELECT 
        p.codigo_producto,
        p.nombre AS descripcion,
        p.precio_compra AS p_compra,
        p.precio_venta AS p_venta,
        i.cantidad AS existencia,
        i.stock_minimo AS inv_minimo,
        c.nombre_categoria AS categoria
      FROM productos p
      LEFT JOIN inventario i ON p.codigo_producto = i.codigo_producto
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
    `;

    const params = [];
    if (categoriaId) {
      query += ` WHERE p.id_categoria = ?`;
      params.push(categoriaId);
    }

    const [rows] = await db.execute(query, params);
    return rows;
  },

  getCategorias: async () => {
    const [rows] = await db.execute(`SELECT id_categoria, nombre_categoria FROM categorias`);
    return rows;
  }
};

export default ReporteInventarioModel;
