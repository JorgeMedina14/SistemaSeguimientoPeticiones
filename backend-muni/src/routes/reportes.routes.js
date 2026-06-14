const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportes.controller');
const { authenticateJWT } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

router.get('/resumen',
  authenticateJWT,
  authorizeRoles('ADMIN', 'ALCALDE'),
  reportesController.resumen
);

router.get('/por-departamento',
  authenticateJWT,
  authorizeRoles('ADMIN', 'ALCALDE'),
  reportesController.porDepartamento
);

router.get('/tiempos',
  authenticateJWT,
  authorizeRoles('ADMIN', 'ALCALDE'),
  reportesController.tiempos
);

router.get('/ciudadanos-frecuentes',
  authenticateJWT,
  authorizeRoles('ADMIN', 'ALCALDE'),
  reportesController.ciudadanosFrecuentes
);

router.get('/dashboard',
  authenticateJWT,
  authorizeRoles('ADMIN', 'ALCALDE'),
  reportesController.dashboard
);

module.exports = router;
