const express = require('express');
const router = express.Router();
const peticionesController = require('../controllers/peticiones.controller');
const { authenticateJWT } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

router.use(authenticateJWT);

router.get('/', authorizeRoles('ADMIN', 'ALCALDE', 'JEFE_DEPTO', 'RECEPCION'), peticionesController.listar);
router.get('/:id', authorizeRoles('ADMIN', 'ALCALDE', 'JEFE_DEPTO', 'RECEPCION'), peticionesController.obtenerDetalle);
router.post('/', authorizeRoles('RECEPCION', 'ALCALDE'), peticionesController.crear);
router.put('/:id/estado', authorizeRoles('ADMIN', 'ALCALDE', 'JEFE_DEPTO'), peticionesController.cambiarEstado);
router.delete('/:id', authorizeRoles('ADMIN', 'ALCALDE'), peticionesController.eliminar);

module.exports = router;
