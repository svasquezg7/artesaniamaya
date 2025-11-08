import db from '../config/db.js';

const CategoriaModel = {
  getAll: async () => {
    const [rows] = await db.execute('SELECT * FROM categorias');
    return rows;
  },

  create: async (data) => {
    const { nombre_categoria } = data;
    await db.execute(
      'INSERT INTO categorias (nombre_categoria) VALUES (?)',
      [nombre_categoria]
    );
  },

  update: async (id, data) => {
    const { nombre_categoria } = data;
    await db.execute(
      'UPDATE categorias SET nombre_categoria=? WHERE id_categoria=?',
      [nombre_categoria, id]
    );
  },

  delete: async (id) => {
    await db.execute('DELETE FROM categorias WHERE id_categoria=?', [id]);
  }
};

export default CategoriaModel;
