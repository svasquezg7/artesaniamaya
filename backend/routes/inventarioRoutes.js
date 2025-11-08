import express from 'express';
import {
  getInventario,
  buscarPorCodigo,
  agregarInventario
} from '../controllers/inventarioController.js';

const router = express.Router();

//  Rutas
router.get('/', getInventario);
router.get('/codigo/:codigo', buscarPorCodigo);
router.post('/', agregarInventario);

export default router;
