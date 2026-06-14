const authService = require('../services/auth.service');

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
    const status = error.status || 500;
    const message = error.message || 'Error en el servidor';

    return res.status(status).json({
      success: false,
      message
    });
  }
};

const getMe = async (req, res) => {
  try {
    const { idUsuario } = req.user;

    const user = await authService.getProfile(idUsuario);

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || 'Error en el servidor';

    return res.status(status).json({
      success: false,
      message
    });
  }
};

module.exports = {
  login,
  getMe
};
