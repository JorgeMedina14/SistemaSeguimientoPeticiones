const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

const ok = (label, ...roles) => [
  authenticateJWT,
  authorizeRoles(...roles),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: `Acceso permitido a ${label}`,
      usuario: {
        id: req.user.idUsuario,
        username: req.user.username,
        rol: req.user.rol
      }
    });
  }
];

router.get('/admin', ...ok('ADMIN', 'ADMIN'));
router.get('/alcalde', ...ok('ALCALDE', 'ALCALDE'));
router.get('/recepcion', ...ok('RECEPCION', 'RECEPCION'));
router.get('/jefe', ...ok('JEFE_DEPTO', 'JEFE_DEPTO'));
router.get('/admin-alcalde', ...ok('ADMIN o ALCALDE', 'ADMIN', 'ALCALDE'));

module.exports = router;
