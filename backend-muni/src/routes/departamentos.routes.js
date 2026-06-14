const express = require('express');
const router = express.Router();
const departamentosController = require('../controllers/departamentos.controller');
const { authenticateJWT } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

router.get('/',
  authenticateJWT,
  authorizeRoles('ADMIN', 'RECEPCION', 'ALCALDE'),
  departamentosController.listar
);

module.exports = router;
