import ReporteInventarioModel from '../models/reporteInventarioModel.js';

export const getReporteInventario = async (req, res) => {
  try {
    const { categoria } = req.query; // ?categoria=#
    const data = await ReporteInventarioModel.getReporte(categoria || null);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener reporte de inventario', error });
  }
};

export const getCategorias = async (req, res) => {
  try {
    const categorias = await ReporteInventarioModel.getCategorias();
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener categorías', error });
  }
};
