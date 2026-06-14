const authorizeRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para acceder a este recurso',
        rolRequerido: rolesPermitidos,
        rolActual: req.user.rol
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
