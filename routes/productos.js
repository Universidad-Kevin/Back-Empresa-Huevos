import express from 'express';
import { 
  getProductos, 
  getProductoById, 
  createProducto,
  updateProducto,
  deleteProducto,
  getAllProductos,
  getProductosInactivos
} from '../controllers/productosController.js';
import { authenticateToken } from '../middleware/auth.js';
import { reactivarProducto } from '../controllers/productosController.js';

const router = express.Router();

// ✅ Rutas públicas
router.get('/', getProductos);
router.get('/all', getAllProductos);
router.get('/inactivos', getProductosInactivos);
router.get('/:id', getProductoById);

// ✅ Rutas protegidas (requieren autenticación)
router.post('/', authenticateToken, createProducto);
router.put('/:id', authenticateToken, updateProducto);
router.delete('/:id', authenticateToken, deleteProducto);
router.patch('/:id/reactivar', authenticateToken, reactivarProducto);

export default router;