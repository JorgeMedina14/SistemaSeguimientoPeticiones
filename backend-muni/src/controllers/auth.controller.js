const authService = require('../services/auth.service');

const fail = (res, error) => {
  const status = error.status || 500;
  return res.status(status).json({
    success: false,
    message: error.message || 'Error en el servidor'
  });
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username y password son requeridos'
      });
    }

    const result = await authService.login(username, password);

    return res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: result
    });
  } catch (error) {
    return fail(res, error);
  }
};

const getMe = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user.idUsuario);
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    return fail(res, error);
  }
};

module.exports = {
  login,
  getMe
};
