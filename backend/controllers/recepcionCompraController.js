import RecepcionCompraModel from '../models/recepcionCompraModel.js';

export const listar = async (req, res) => {
  try {
    res.json(await RecepcionCompraModel.list());
  } catch (e) {
    res.status(500).json({ message: 'Error al listar recepciones', error: e.message || e });
  }
};

export const obtener = async (req, res) => {
  try {
    const rc = await RecepcionCompraModel.getById(req.params.id);
    if (!rc) return res.status(404).json({ message: 'Recepción no encontrada' });
    res.json(rc);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener', error: e.message || e });
  }
};

export const obtenerConDetalle = async (req, res) => {
  try {
    const rc = await RecepcionCompraModel.getWithDetalle(req.params.id);
    if (!rc) return res.status(404).json({ message: 'Recepción no encontrada' });
    res.json(rc);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener detalle', error: e.message || e });
  }
};

export const crear = async (req, res) => {
  try {
    const { cabecera, detalles } = req.body;

    if (!cabecera?.id_orden || !cabecera?.id_proveedor || !cabecera?.fecha_recepcion) {
      return res.status(400).json({ message: 'Cabecera incompleta' });
    }
    if (!Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({ message: 'Debe agregar al menos un producto' });
    }

    const { id_recepcion, estadoOC } = await RecepcionCompraModel.create(cabecera, detalles);
    res.json({ message: 'Recepción creada', id_recepcion, estadoOC });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Error al crear' });
  }
};


export const anular = async (req, res) => {
  try {
    const { motivo } = req.body || {};
    const r = await RecepcionCompraModel.anular(req.params.id, motivo || 'Anulación de recepción');
    res.json(r);
  } catch (e) {
    res.status(400).json({ message: e.message || 'Error al anular' });
  }
};

/** Utils */
export const listarOrdenesGeneradas = async (_req, res) => {
  try {
    res.json(await RecepcionCompraModel.getOrdenesGeneradas());
  } catch (e) {
    res.status(500).json({ message: 'Error al listar OC', error: e.message || e });
  }
};

export const productoPorCodigo = async (req, res) => {
  try {
    const p = await RecepcionCompraModel.getProductoByCodigo(req.params.codigo);
    if (!p) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(p);
  } catch (e) {
    res.status(500).json({ message: 'Error producto', error: e.message || e });
  }
};
