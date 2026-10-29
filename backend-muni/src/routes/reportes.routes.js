const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportes.controller');
const { authenticateJWT } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

router.use(authenticateJWT, authorizeRoles('ADMIN', 'ALCALDE'));

router.get('/resumen', reportesController.resumen);
router.get('/por-departamento', reportesController.porDepartamento);
router.get('/tiempos', reportesController.tiempos);
router.get('/ciudadanos-frecuentes', reportesController.ciudadanosFrecuentes);
router.get('/dashboard', reportesController.dashboard);

module.exports = router;
