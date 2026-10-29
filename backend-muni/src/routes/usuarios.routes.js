const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');
const { authenticateJWT } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

router.use(authenticateJWT, authorizeRoles('ADMIN'));

router.post('/', usuariosController.crear);
router.get('/', usuariosController.listar);
router.get('/:id', usuariosController.obtenerPorId);
router.put('/:id', usuariosController.actualizar);
router.patch('/:id/activo', usuariosController.cambiarActivo);
router.patch('/:id/password', usuariosController.cambiarPassword);
router.delete('/:id', usuariosController.eliminar);

module.exports = router;
