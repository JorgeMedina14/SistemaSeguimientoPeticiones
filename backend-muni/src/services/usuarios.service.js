const bcrypt = require('bcrypt');
const usuariosRepository = require('../repositories/usuarios.repository');

const SALT_ROUNDS = 10;

const validarRol = (rol) => {
  const rolesValidos = ['ADMIN', 'ALCALDE', 'JEFE_DEPTO', 'RECEPCION'];
  if (!rolesValidos.includes(rol)) {
    throw new Error(`Rol inválido. Debe ser uno de: ${rolesValidos.join(', ')}`);
  }
};

const crearUsuario = async (datosUsuario) => {
  const { username, password, nombreCompleto, rol, idDepartamento } = datosUsuario;
  
  // Validaciones básicas
  if (!username || !password || !nombreCompleto || !rol) {
    throw new Error('Faltan campos requeridos: username, password, nombreCompleto, rol');
  }
  
  // Validar formato username
  if (username.length < 3 || username.length > 50) {
    throw new Error('El username debe tener entre 3 y 50 caracteres');
  }
  
  // Validar password
  if (password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }
  
  // Validar rol
  validarRol(rol);
  
  // Validar username único
  const usuarioExistente = await usuariosRepository.findUsuarioByUsername(username);
  if (usuarioExistente) {
    throw new Error('El username ya existe');
  }
  
  // Validar ALCALDE único
  if (rol === 'ALCALDE') {
    const alcaldesActivos = await usuariosRepository.countAlcaldesActivos();
    if (alcaldesActivos >= 1) {
      throw new Error('Solo puede haber un ALCALDE activo en el sistema');
    }
  }
  
  // Validar JEFE_DEPTO requiere departamento
  if (rol === 'JEFE_DEPTO' && !idDepartamento) {
    throw new Error('El rol JEFE_DEPTO requiere especificar un IdDepartamento');
  }
  
  // Hashear contraseña
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  
  // Crear usuario
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
  
  // Validar paginación
  const pageNum = page ? parseInt(page) : 1;
  const limitNum = limit ? parseInt(limit) : 10;
  
  if (pageNum < 1) {
    throw new Error('El parámetro page debe ser mayor o igual a 1');
  }
  
  if (limitNum < 1) {
    throw new Error('El parámetro limit debe ser mayor o igual a 1');
  }
  
  // Validar rol si se proporciona
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
  
  return await usuariosRepository.findAllUsuarios(filtros);
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
  
  // Validar que el usuario existe
  const usuario = await usuariosRepository.findUsuarioById(idUsuario);
  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }
  
  // No permitir que un ADMIN se actualice a sí mismo si es el único ADMIN
  if (usuarioActual.idUsuario === idUsuario && usuario.rol === 'ADMIN') {
    const todosUsuarios = await usuariosRepository.findAllUsuarios({});
    const adminsActivos = todosUsuarios.data.filter(u => u.rol === 'ADMIN' && u.activo);
    if (adminsActivos.length === 1 && rol !== 'ADMIN') {
      throw new Error('No puedes cambiar tu propio rol si eres el único ADMIN activo');
    }
  }
  
  // Validar campos si se proporcionan
  if (nombreCompleto !== undefined && !nombreCompleto) {
    throw new Error('El nombreCompleto no puede estar vacío');
  }
  
  if (rol !== undefined) {
    validarRol(rol);
    
    // Validar ALCALDE único
    if (rol === 'ALCALDE' && usuario.rol !== 'ALCALDE') {
      const alcaldesActivos = await usuariosRepository.countAlcaldesActivos();
      if (alcaldesActivos >= 1) {
        throw new Error('Solo puede haber un ALCALDE activo en el sistema');
      }
    }
    
    // Validar JEFE_DEPTO requiere departamento
    if (rol === 'JEFE_DEPTO' && !idDepartamento && !usuario.idDepartamento) {
      throw new Error('El rol JEFE_DEPTO requiere especificar un IdDepartamento');
    }
  }
  
  // Preparar datos a actualizar
  const datosParaActualizar = {
    nombreCompleto: nombreCompleto || usuario.nombreCompleto,
    rol: rol || usuario.rol,
    idDepartamento: (rol || usuario.rol) === 'JEFE_DEPTO' 
      ? (idDepartamento !== undefined ? idDepartamento : usuario.idDepartamento)
      : null
  };
  
  return await usuariosRepository.updateUsuario(idUsuario, datosParaActualizar);
};

const cambiarActivoUsuario = async (idUsuario, activo, usuarioActual) => {
  // Validar que el usuario existe
  const usuario = await usuariosRepository.findUsuarioById(idUsuario);
  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }
  
  // No permitir desactivarse a sí mismo
  if (usuarioActual.idUsuario === idUsuario && !activo) {
    throw new Error('No puedes desactivar tu propia cuenta');
  }
  
  // No permitir desactivar al único ADMIN activo
  if (usuario.rol === 'ADMIN' && !activo) {
    const todosUsuarios = await usuariosRepository.findAllUsuarios({});
    const adminsActivos = todosUsuarios.data.filter(u => u.rol === 'ADMIN' && u.activo);
    if (adminsActivos.length === 1) {
      throw new Error('No puedes desactivar al único ADMIN activo del sistema');
    }
  }
  
  return await usuariosRepository.updateUsuarioActivo(idUsuario, activo);
};

const cambiarPasswordUsuario = async (idUsuario, nuevaPassword) => {
  // Validar que el usuario existe
  const usuario = await usuariosRepository.findUsuarioById(idUsuario);
  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }
  
  // Validar nueva contraseña
  if (!nuevaPassword || nuevaPassword.length < 6) {
    throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
  }
  
  // Hashear nueva contraseña
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
    const todosUsuarios = await usuariosRepository.findAllUsuarios({});
    const adminsActivos = todosUsuarios.data.filter((u) => u.rol === 'ADMIN' && u.activo);
    if (adminsActivos.length === 1) {
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
