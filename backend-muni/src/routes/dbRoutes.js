const express = require('express');
const router = express.Router();
const dbController = require('../controllers/dbController');
const { authenticateJWT } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Diagnóstico de BD: solo administradores autenticados
router.get(
  '/ping',
  authenticateJWT,
  authorizeRoles('ADMIN'),
  dbController.pingDatabase
);

module.exports = router;
