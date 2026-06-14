const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

router.get('/admin', authenticateJWT, authorizeRoles('ADMIN'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Acceso permitido a ADMIN',
    usuario: {
      id: req.user.idUsuario,
      username: req.user.username,
      rol: req.user.rol
    }
  });
});

router.get('/alcalde', authenticateJWT, authorizeRoles('ALCALDE'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Acceso permitido a ALCALDE',
    usuario: {
      id: req.user.idUsuario,
      username: req.user.username,
      rol: req.user.rol
    }
  });
});

router.get('/recepcion', authenticateJWT, authorizeRoles('RECEPCION'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Acceso permitido a RECEPCION',
    usuario: {
      id: req.user.idUsuario,
      username: req.user.username,
      rol: req.user.rol
    }
  });
});

router.get('/jefe', authenticateJWT, authorizeRoles('JEFE_DEPTO'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Acceso permitido a JEFE_DEPTO',
    usuario: {
      id: req.user.idUsuario,
      username: req.user.username,
      rol: req.user.rol
    }
  });
});

router.get('/admin-alcalde', authenticateJWT, authorizeRoles('ADMIN', 'ALCALDE'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Acceso permitido a ADMIN o ALCALDE',
    usuario: {
      id: req.user.idUsuario,
      username: req.user.username,
      rol: req.user.rol
    }
  });
});

module.exports = router;
