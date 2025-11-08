import express from 'express';
import { importarProductos, upload } from '../controllers/productosExcelController.js';

const router = express.Router();

// 📥 Importar Excel
router.post('/importar', upload.single('file'), importarProductos);

export default router;
