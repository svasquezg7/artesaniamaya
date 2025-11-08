import GuiaModel from '../models/guiaModel.js';

export const getGuias = async (req, res) => {
  try {
    const guias = await GuiaModel.getAll();
    res.json(guias);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener guías', error });
  }
};

export const createGuia = async (req, res) => {
  try {
    await GuiaModel.create(req.body);
    res.json({ message: 'Guía creada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear guía', error });
  }
};

export const updateGuia = async (req, res) => {
  try {
    await GuiaModel.update(req.params.id, req.body);
    res.json({ message: 'Guía actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar guía', error });
  }
};

export const deleteGuia = async (req, res) => {
  try {
    await GuiaModel.delete(req.params.id);
    res.json({ message: 'Guía eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar guía', error });
  }
};
