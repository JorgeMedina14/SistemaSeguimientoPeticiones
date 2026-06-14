const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');
const { authenticateJWT } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Todas las rutas solo para ADMIN
router.post('/', authenticateJWT, authorizeRoles('ADMIN'), usuariosController.crear);
router.get('/', authenticateJWT, authorizeRoles('ADMIN'), usuariosController.listar);
router.get('/:id', authenticateJWT, authorizeRoles('ADMIN'), usuariosController.obtenerPorId);
router.put('/:id', authenticateJWT, authorizeRoles('ADMIN'), usuariosController.actualizar);
router.patch('/:id/activo', authenticateJWT, authorizeRoles('ADMIN'), usuariosController.cambiarActivo);
router.patch('/:id/password', authenticateJWT, authorizeRoles('ADMIN'), usuariosController.cambiarPassword);
router.delete('/:id', authenticateJWT, authorizeRoles('ADMIN'), usuariosController.eliminar);

module.exports = router;
