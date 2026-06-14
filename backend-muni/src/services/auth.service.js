const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authRepository = require('../repositories/auth.repository');

const login = async (username, password) => {
  const user = await authRepository.findUserByUsername(username);

  if (!user) {
    throw {
      status: 401,
      message: 'Credenciales inválidas'
    };
  }

  const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);

  if (!isPasswordValid) {
    throw {
      status: 401,
      message: 'Credenciales inválidas'
    };
  }

  if (!user.Activo) {
    throw {
      status: 403,
      message: 'Usuario inactivo'
    };
  }

  const token = jwt.sign(
    {
      idUsuario: user.IdUsuario,
      username: user.Username,
      rol: user.Rol,
      activo: user.Activo,
      idDepartamento: user.IdDepartamento
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  return {
    token,
    user: {
      idUsuario: user.IdUsuario,
      username: user.Username,
      nombreCompleto: user.NombreCompleto,
      rol: user.Rol,
      idDepartamento: user.IdDepartamento
    }
  };
};

const getProfile = async (idUsuario) => {
  const user = await authRepository.findUserById(idUsuario);

  if (!user) {
    throw {
      status: 404,
      message: 'Usuario no encontrado'
    };
  }

  if (!user.Activo) {
    throw {
      status: 403,
      message: 'Usuario inactivo'
    };
  }

  return {
    idUsuario: user.IdUsuario,
    username: user.Username,
    nombreCompleto: user.NombreCompleto,
    rol: user.Rol,
    idDepartamento: user.IdDepartamento,
    activo: user.Activo
  };
};

module.exports = {
  login,
  getProfile
};
