import express from 'express';
import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario
} from '../controllers/usuariosCrudController.js';

const router = express.Router();

router.get('/', getUsuarios);
router.post('/', createUsuario);
router.put('/:id', updateUsuario);
router.delete('/:id', deleteUsuario);

export default router;
