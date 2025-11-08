import ClienteModel from '../models/clienteModel.js';

// Obtener todos los clientes
export const getClientes = async (req, res) => {
  try {
    const clientes = await ClienteModel.getAll();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener clientes', error });
  }
};

// Crear cliente
export const createCliente = async (req, res) => {
  try {
    await ClienteModel.create(req.body);
    res.json({ message: 'Cliente creado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear cliente', error });
  }
};

// Actualizar cliente
export const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    await ClienteModel.update(id, req.body);
    res.json({ message: 'Cliente actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar cliente', error });
  }
};

// Eliminar cliente
export const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;
    await ClienteModel.delete(id);
    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar cliente', error });
  }
};
