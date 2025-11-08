import db from '../config/db.js';

const ProveedorModel = {
  getAll: async () => {
    const [rows] = await db.execute(`
      SELECT id_proveedor, nombre, empresa, telefono, correo, direccion, estado, fecha_creacion
        FROM proveedores
       ORDER BY id_proveedor DESC
    `);
    return rows;
  },

  create: async (data) => {
    const { nombre, empresa, telefono, correo, direccion, estado } = data;
    const [r] = await db.execute(
      `INSERT INTO proveedores (nombre, empresa, telefono, correo, direccion, estado)
       VALUES (?,?,?,?,?,?)`,
      [
        nombre || '',
        empresa || null,
        telefono || null,
        correo || null,
        direccion || null,
        estado || 'ACTIVO'
      ]
    );
    return r.insertId;
  },

  update: async (id, data) => {
    const { nombre, empresa, telefono, correo, direccion, estado } = data;
    await db.execute(
      `UPDATE proveedores
          SET nombre=?, empresa=?, telefono=?, correo=?, direccion=?, estado=?
        WHERE id_proveedor=?`,
      [
        nombre || '',
        empresa || null,
        telefono || null,
        correo || null,
        direccion || null,
        estado || 'ACTIVO',
        id
      ]
    );
  },

  delete: async (id) => {
    await db.execute(`DELETE FROM proveedores WHERE id_proveedor=?`, [id]);
  },

  search: async (term) => {
    const like = `%${term}%`;
    const [rows] = await db.execute(
      `SELECT id_proveedor, nombre, empresa, telefono, correo, estado
         FROM proveedores
        WHERE nombre LIKE ? OR empresa LIKE ?
        ORDER BY nombre
        LIMIT 50`,
      [like, like]
    );
    return rows;
  }
};

export default ProveedorModel;
