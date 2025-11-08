import pool from '../config/db.js';

// 📋 Obtener todos los usuarios
export const getUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM usuarios ORDER BY id_usuario DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios', error });
  }
};

// ➕ Crear usuario
export const createUsuario = async (req, res) => {
  try {
    const { nombre, apellido, usuario, password, rol, correo, telefono, estado } = req.body;
    await pool.query(
      `INSERT INTO usuarios (nombre, apellido, usuario, password, rol, correo, telefono, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, usuario, password, rol, correo, telefono, estado]
    );
    res.json({ message: 'Usuario creado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear usuario', error });
  }
};

// ✏️ Actualizar usuario
export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, usuario, password, rol, correo, telefono, estado } = req.body;

    await pool.query(
      `UPDATE usuarios 
       SET nombre=?, apellido=?, usuario=?, password=?, rol=?, correo=?, telefono=?, estado=? 
       WHERE id_usuario=?`,
      [nombre, apellido, usuario, password, rol, correo, telefono, estado, id]
    );
    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar usuario', error });
  }
};

// ❌ Eliminar usuario
export const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM usuarios WHERE id_usuario=?', [id]);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar usuario', error });
  }
};
