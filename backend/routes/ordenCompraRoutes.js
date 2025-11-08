import express from 'express';
import {
  listar,
  obtener,
  listarProveedores,
  listarSugerencias,
  productoPorCodigo,
  crear,
  actualizar,
  cambiarEstado,
  eliminar,
  obtenerConDetalle,
} from '../controllers/ordenCompraController.js';
import { generarPDF } from '../controllers/ordenCompraPDFController.js';

const router = express.Router();

// 🔹 Primero las rutas fijas (para que no las capture :id)
router.get('/utils/proveedores/list', listarProveedores);
router.get('/utils/sugerencias/list', listarSugerencias);
router.get('/utils/producto/:codigo', productoPorCodigo);

// 🔹 Luego las operaciones principales
router.get('/', listar);
router.post('/', crear);
router.put('/:id', actualizar);
router.put('/:id/estado', cambiarEstado);
router.delete('/:id', eliminar);

// 🔹 Después las rutas que usan :id (para evitar conflictos)
router.get('/:id/detalle', obtenerConDetalle);
router.get('/:id', obtener);

router.get('/:id/pdf', generarPDF);


export default router;
