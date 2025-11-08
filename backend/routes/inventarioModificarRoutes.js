import express from 'express';
import {
  getInventario,
  buscarPorCodigo,
  actualizarInventario
} from '../controllers/inventarioModificarController.js';

const router = express.Router();

router.get('/', getInventario);
router.get('/buscar/:codigo', buscarPorCodigo);
router.put('/', actualizarInventario);

export default router;
