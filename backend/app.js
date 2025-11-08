import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import usuarioRoutes from './routes/usuarioRoutes.js';
import usuariosCrudRoutes from './routes/usuariosCrudRoutes.js'; // nuevo CRUD
import clienteRoutes from './routes/clienteRoutes.js';
import guiaRoutes from './routes/guiaRoutes.js';
import proveedorRoutes from './routes/proveedorRoutes.js';
import categoriaRoutes from './routes/categoriaRoutes.js';
import productoRoutes from './routes/productoRoutes.js';
import productosExcelRoutes from './routes/productosExcelRoutes.js';
import inventarioRoutes from './routes/inventarioRoutes.js';
import inventarioModificarRoutes from './routes/inventarioModificarRoutes.js';
import reporteInventarioRoutes from './routes/reporteInventarioRoutes.js';
import ordenCompraRoutes from './routes/ordenCompraRoutes.js';
import recepcionCompraRoutes from './routes/recepcionCompraRoutes.js';
//aqui esta las modificaciones de ventas/*
import ventasRoutes from './routes/ventasRoutes.js';
import cajaRoutes from './routes/cajaRoutes.js';
import ticketPendienteRoutes from './routes/ticketPendienteRoutes.js';
import ventasHistorialRoutes from './routes/ventasHistorialRoutes.js';





dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


app.use('/api/usuarios', usuarioRoutes);

// CRUD de usuarios (separado)
app.use('/api/usuarios-crud', usuariosCrudRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/guias', guiaRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/productos-excel', productosExcelRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/inventario-modificar', inventarioModificarRoutes);
app.use('/api/reporte-inventario', reporteInventarioRoutes);
app.use('/api/orden-compra', ordenCompraRoutes);
app.use('/api/recepcion-compra', recepcionCompraRoutes);

///aqui esta las modificaciones de ventas
app.use('/api/ventas', ventasRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/tickets', ticketPendienteRoutes);
app.use('/api/ventas-historial', ventasHistorialRoutes);



app.listen(process.env.PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${process.env.PORT}`);
});

