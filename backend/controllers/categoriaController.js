import CategoriaModel from '../models/categoriaModel.js';

export const getCategorias = async (req, res) => {
  try {
    const categorias = await CategoriaModel.getAll();
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener categorías', error });
  }
};

export const createCategoria = async (req, res) => {
  try {
    await CategoriaModel.create(req.body);
    res.json({ message: 'Categoría creada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear categoría', error });
  }
};

export const updateCategoria = async (req, res) => {
  try {
    await CategoriaModel.update(req.params.id, req.body);
    res.json({ message: 'Categoría actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar categoría', error });
  }
};

export const deleteCategoria = async (req, res) => {
  try {
    await CategoriaModel.delete(req.params.id);
    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar categoría', error });
  }
};
