// backend/routes/proveedorRoutes.js
import { Router } from 'express';
import {
  getProveedores,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  buscarProveedores, // ✅ ahora sí existe
} from '../controllers/proveedorController.js';

const r = Router();

// Buscar por nombre/NIT (antes de rutas con :id para evitar conflictos)
r.get('/buscar/:term', buscarProveedores);

// CRUD básico
r.get('/', getProveedores);
r.post('/', createProveedor);
r.put('/:id', updateProveedor);
r.delete('/:id', deleteProveedor);

export default r;
