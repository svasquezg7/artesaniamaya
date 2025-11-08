import db from '../config/db.js';

const GuiaModel = {
  getAll: async () => {
    const [rows] = await db.execute('SELECT * FROM guias');
    return rows;
  },

  create: async (data) => {
    const { nombre, apellido, telefono, correo, lugar, nota, estado } = data;
    await db.execute(
      'INSERT INTO guias (nombre, apellido, telefono, correo, lugar, nota, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, apellido, telefono, correo, lugar, nota, estado]
    );
  },

  update: async (id, data) => {
    const { nombre, apellido, telefono, correo, lugar, nota, estado } = data;
    await db.execute(
      'UPDATE guias SET nombre=?, apellido=?, telefono=?, correo=?, lugar=?, nota=?, estado=? WHERE id_guia=?',
      [nombre, apellido, telefono, correo, lugar, nota, estado, id]
    );
  },

  delete: async (id) => {
    await db.execute('DELETE FROM guias WHERE id_guia=?', [id]);
  }
};

export default GuiaModel;
