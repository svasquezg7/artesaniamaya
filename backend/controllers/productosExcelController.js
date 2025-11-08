import multer from 'multer';
import XLSX from 'xlsx';
import db from '../config/db.js';

// 📦 Configurar multer para leer el archivo en memoria
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// ✅ Importar productos desde Excel
export const importarProductos = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se subió ningún archivo Excel' });
    }

    // Leer el archivo recibido
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const hoja = workbook.Sheets[workbook.SheetNames[0]];
    const productos = XLSX.utils.sheet_to_json(hoja);

    let insertados = 0;

    for (const prod of productos) {
      const { codigo_producto, nombre, id_categoria } = prod;

      if (codigo_producto && nombre && id_categoria) {
        await db.execute(
          'INSERT INTO productos (codigo_producto, nombre, id_categoria) VALUES (?, ?, ?)',
          [codigo_producto, nombre, id_categoria]
        );
        insertados++;
      }
    }

    res.json({ message: `Se importaron ${insertados} productos correctamente.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al importar productos', error });
  }
};
