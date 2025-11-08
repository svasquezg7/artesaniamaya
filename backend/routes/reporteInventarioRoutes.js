import express from 'express';
import { getReporteInventario, getCategorias } from '../controllers/reporteInventarioController.js';

const router = express.Router();

router.get('/', getReporteInventario);
router.get('/categorias', getCategorias);

export default router;

