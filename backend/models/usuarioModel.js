import pool from '../config/db.js';

const UsuarioModel = {
  findByUsername: async (usuario) => {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE usuario = ? AND estado="ACTIVO"', [usuario]);
    return rows[0];
  }
};

export default UsuarioModel;


