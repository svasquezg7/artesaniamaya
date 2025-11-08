import UsuarioModel from '../models/usuarioModel.js';


export const login = async (req, res) => {
  const { usuario, password } = req.body;
  try {
    const user = await UsuarioModel.findByUsername(usuario);

    if (!user)
      return res.status(401).json({ message: 'Usuario no encontrado' });

    if (user.password !== password)
      return res.status(401).json({ message: 'Contraseña incorrecta' });

    res.json({
      message: 'Login exitoso',
      usuario: {
        id: user.id_usuario,
        nombre: user.nombre,
        rol: user.rol
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};
