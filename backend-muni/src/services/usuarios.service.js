const bcrypt = require('bcrypt');
const usuariosRepository = require('../repositories/usuarios.repository');

const SALT_ROUNDS = 10;

const validarRol = (rol) => {
  const rolesValidos = ['ADMIN', 'ALCALDE', 'JEFE_DEPTO', 'RECEPCION'];
  if (!rolesValidos.includes(rol)) {
    throw new Error(`Rol inválido. Debe ser uno de: ${rolesValidos.join(', ')}`);
  }
};

const contarAdminsActivosEnPagina = async () => {
  const todosUsuarios = await usuariosRepository.findAllUsuarios({});
  return todosUsuarios.data.filter((u) => u.rol === 'ADMIN' && u.activo).length;
};

const crearUsuario = async (datosUsuario) => {
  const { username, password, nombreCompleto, rol, idDepartamento } = datosUsuario;

  if (!username || !password || !nombreCompleto || !rol) {
    throw new Error('Faltan campos requeridos: username, password, nombreCompleto, rol');
  }

  if (username.length < 4 || username.length > 50) {
    throw new Error('El username debe tener entre 4 y 50 caracteres');
  }

  if (password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }

  validarRol(rol);

  const usuarioExistente = await usuariosRepository.findUsuarioByUsername(username);
  if (usuarioExistente) {
    throw new Error('El username ya existe');
  }

  if (rol === 'ALCALDE') {
    const alcaldesActivos = await usuariosRepository.countAlcaldesActivos();
    if (alcaldesActivos >= 1) {
      throw new Error('Solo puede haber un ALCALDE activo en el sistema');
    }
  }

  if (rol === 'JEFE_DEPTO' && !idDepartamento) {
    throw new Error('El rol JEFE_DEPTO requiere especificar un IdDepartamento');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const nuevoUsuario = await usuariosRepository.createUsuario({
    username,
    passwordHash,
    nombreCompleto,
    rol,
    idDepartamento: rol === 'JEFE_DEPTO' ? idDepartamento : null
  });
  
  return nuevoUsuario;
};

const listarUsuarios = async (query) => {
  const { page, limit, rol, activo, departamento } = query;

  const pageNum = page ? parseInt(page) : 1;
  const limitNum = limit ? parseInt(limit) : 10;
  
  if (pageNum < 1) {
    throw new Error('El parámetro page debe ser mayor o igual a 1');
  }
  
  if (limitNum < 1) {
    throw new Error('El parámetro limit debe ser mayor o igual a 1');
  }
  
  if (rol) {
    validarRol(rol);
  }
  
  const filtros = {
    page: pageNum,
    limit: limitNum,
    rol,
    activo,
    departamento: departamento ? parseInt(departamento) : undefined
  };
  
  return usuariosRepository.findAllUsuarios(filtros);
};

const obtenerUsuarioPorId = async (idUsuario) => {
  const usuario = await usuariosRepository.findUsuarioById(idUsuario);
  
  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }
  
  return usuario;
};

const actualizarUsuario = async (idUsuario, datosActualizacion, usuarioActual) => {
  const { nombreCompleto, rol, idDepartamento } = datosActualizacion;

  const usuario = await usuariosRepository.findUsuarioById(idUsuario);
  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  if (usuarioActual.idUsuario === idUsuario && usuario.rol === 'ADMIN') {
    if ((await contarAdminsActivosEnPagina()) === 1 && rol !== 'ADMIN') {
      throw new Error('No puedes cambiar tu propio rol si eres el único ADMIN activo');
    }
  }

  if (nombreCompleto !== undefined && !nombreCompleto) {
    throw new Error('El nombreCompleto no puede estar vacío');
  }

  if (rol !== undefined) {
    validarRol(rol);

    if (rol === 'ALCALDE' && usuario.rol !== 'ALCALDE') {
      const alcaldesActivos = await usuariosRepository.countAlcaldesActivos();
      if (alcaldesActivos >= 1) {
        throw new Error('Solo puede haber un ALCALDE activo en el sistema');
      }
    }

    if (rol === 'JEFE_DEPTO' && !idDepartamento && !usuario.idDepartamento) {
      throw new Error('El rol JEFE_DEPTO requiere especificar un IdDepartamento');
    }
  }

  const datosParaActualizar = {
    nombreCompleto: nombreCompleto || usuario.nombreCompleto,
    rol: rol || usuario.rol,
    idDepartamento: (rol || usuario.rol) === 'JEFE_DEPTO' 
      ? (idDepartamento !== undefined ? idDepartamento : usuario.idDepartamento)
      : null
  };
  
  return usuariosRepository.updateUsuario(idUsuario, datosParaActualizar);
};

const cambiarActivoUsuario = async (idUsuario, activo, usuarioActual) => {
  const usuario = await usuariosRepository.findUsuarioById(idUsuario);
  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  if (usuarioActual.idUsuario === idUsuario && !activo) {
    throw new Error('No puedes desactivar tu propia cuenta');
  }

  if (usuario.rol === 'ADMIN' && !activo) {
    if ((await contarAdminsActivosEnPagina()) === 1) {
      throw new Error('No puedes desactivar al único ADMIN activo del sistema');
    }
  }

  return usuariosRepository.updateUsuarioActivo(idUsuario, activo);
};

const cambiarPasswordUsuario = async (idUsuario, nuevaPassword) => {
  const usuario = await usuariosRepository.findUsuarioById(idUsuario);
  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  if (!nuevaPassword || nuevaPassword.length < 6) {
    throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
  }

  const passwordHash = await bcrypt.hash(nuevaPassword, SALT_ROUNDS);
  
  await usuariosRepository.updateUsuarioPassword(idUsuario, passwordHash);
  
  return { mensaje: 'Contraseña actualizada exitosamente' };
};

const eliminarUsuario = async (idUsuario, usuarioActual) => {
  const usuario = await usuariosRepository.findUsuarioById(idUsuario);

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  if (usuarioActual.idUsuario === idUsuario) {
    throw new Error('No puedes eliminar tu propia cuenta');
  }

  if (usuario.rol === 'ADMIN') {
    if ((await contarAdminsActivosEnPagina()) === 1) {
      throw new Error('No puedes eliminar al único ADMIN activo del sistema');
    }
  }

  const eliminado = await usuariosRepository.deleteUsuario(idUsuario);

  if (!eliminado) {
    throw new Error('No se pudo eliminar el usuario');
  }

  return { mensaje: 'Usuario eliminado exitosamente' };
};

module.exports = {
  crearUsuario,
  listarUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  cambiarActivoUsuario,
  cambiarPasswordUsuario,
  eliminarUsuario
};
