const express = require('express');
const router = express.Router();
const peticionesController = require('../controllers/peticiones.controller');
const { authenticateJWT } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

router.get('/',
  authenticateJWT,
  authorizeRoles('ADMIN', 'ALCALDE', 'JEFE_DEPTO', 'RECEPCION'),
  peticionesController.listar
);

router.get('/:id',
  authenticateJWT,
  authorizeRoles('ADMIN', 'ALCALDE', 'JEFE_DEPTO', 'RECEPCION'),
  peticionesController.obtenerDetalle
);

router.post('/', 
  authenticateJWT, 
  authorizeRoles('RECEPCION', 'ALCALDE'), 
  peticionesController.crear
);

router.put('/:id/estado',
  authenticateJWT,
  authorizeRoles('ADMIN', 'ALCALDE', 'JEFE_DEPTO'),
  peticionesController.cambiarEstado
);

router.delete('/:id',
  authenticateJWT,
  authorizeRoles('ADMIN', 'ALCALDE'),
  peticionesController.eliminar
);

module.exports = router;
