import express from 'express';
import {
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto,
  buscarProductos,
  getProductoByCodigo
} from '../controllers/productoController.js';

const router = express.Router();

router.get('/buscar/:term', buscarProductos);   
router.get('/codigo/:codigo', getProductoByCodigo); 

router.get('/', getProductos);
router.post('/', createProducto);
router.put('/:id', updateProducto);
router.delete('/:id', deleteProducto);

export default router;
