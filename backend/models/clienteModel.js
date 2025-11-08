import pool from '../config/db.js';

const ClienteModel = {
  getAll: async () => {
    const [rows] = await pool.query('SELECT * FROM clientes');
    return rows;
  },

  create: async (data) => {
    const { nombre, apellido, nit, telefono, correo, tipo_cliente, estado } = data;
    await pool.query(
      'INSERT INTO clientes (nombre, apellido, nit, telefono, correo, tipo_cliente, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, apellido, nit, telefono, correo, tipo_cliente, estado]
    );
  },

  update: async (id, data) => {
    const { nombre, apellido, nit, telefono, correo, tipo_cliente, estado } = data;
    await pool.query(
      'UPDATE clientes SET nombre=?, apellido=?, nit=?, telefono=?, correo=?, tipo_cliente=?, estado=? WHERE id_cliente=?',
      [nombre, apellido, nit, telefono, correo, tipo_cliente, estado, id]
    );
  },

  delete: async (id) => {
    await pool.query('DELETE FROM clientes WHERE id_cliente=?', [id]);
  },
};

export default ClienteModel;
