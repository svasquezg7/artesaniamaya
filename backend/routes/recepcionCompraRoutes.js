import express from 'express';
import {
  listar,
  obtener,
  obtenerConDetalle,
  crear,
  anular,
  listarOrdenesGeneradas,
  productoPorCodigo
} from '../controllers/recepcionCompraController.js';

const router = express.Router();

/** Utils */
router.get('/utils/ordenes-generadas', listarOrdenesGeneradas);
router.get('/utils/producto/:codigo', productoPorCodigo);

/** CRUD */
router.get('/', listar);
router.get('/:id', obtener);
router.get('/:id/detalle', obtenerConDetalle);
router.post('/', crear);
router.post('/:id/anular', anular);

export default router;