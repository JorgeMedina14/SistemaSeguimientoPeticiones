const { getPool } = require('../db/pool');
const sql = require('mssql');
const peticionesRepository = require('../repositories/peticiones.repository');

const ESTADOS_VALIDOS = ['RECIBIDA', 'EN_REVISION', 'ASIGNADA', 'EN_PROCESO', 'RESUELTA', 'RECHAZADA', 'CERRADA'];

const crearPeticion = async (data, idUsuario) => {
  const { ciudadano, peticion, idDepartamento } = data;

  if (!ciudadano || !ciudadano.dpi) {
    throw { status: 400, message: 'DPI del ciudadano es requerido' };
  }

  if (!ciudadano.dpi.match(/^\d{13}$/)) {
    throw { status: 400, message: 'DPI debe tener exactamente 13 dígitos numéricos' };
  }

  if (!peticion || !peticion.titulo || !peticion.descripcion) {
    throw { status: 400, message: 'Titulo y descripcion son requeridos' };
  }

  if (!idDepartamento) {
    throw { status: 400, message: 'idDepartamento es requerido' };
  }

  const prioridad = peticion.prioridad || 'MEDIA';
  if (!['BAJA', 'MEDIA', 'ALTA'].includes(prioridad)) {
    throw { status: 400, message: 'Prioridad debe ser BAJA, MEDIA o ALTA' };
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    let idCiudadano;
    const ciudadanoExistente = await peticionesRepository.findCiudadanoByDPI(ciudadano.dpi);

    if (ciudadanoExistente) {
      idCiudadano = ciudadanoExistente.IdCiudadano;
    } else {
      idCiudadano = await peticionesRepository.createCiudadano(transaction, ciudadano);
    }

    const codigo = await peticionesRepository.generateCodigoPeticion(transaction);

    const peticionCreada = await peticionesRepository.createPeticion(transaction, {
      codigo,
      idCiudadano,
      idDepartamento,
      creadoPorUsuarioId: idUsuario,
      titulo: peticion.titulo.trim(),
      descripcion: peticion.descripcion.trim(),
      prioridad
    });

    await peticionesRepository.createSeguimiento(transaction, {
      idPeticion: peticionCreada.IdPeticion,
      idUsuario,
      estadoNuevo: 'RECIBIDA',
      comentario: 'Petición creada y recibida en el sistema'
    });

    await transaction.commit();

    return {
      idPeticion: peticionCreada.IdPeticion,
      codigo: peticionCreada.Codigo,
      estado: peticionCreada.Estado,
      prioridad: peticionCreada.Prioridad,
      fechaCreacion: peticionCreada.FechaCreacion,
      idCiudadano
    };

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const cambiarEstadoPeticion = async (idPeticion, estadoNuevo, comentario, usuario) => {
  if (!estadoNuevo) {
    throw { status: 400, message: 'El estado nuevo es requerido' };
  }

  if (!ESTADOS_VALIDOS.includes(estadoNuevo)) {
    throw { status: 400, message: 'Estado no válido. Debe ser: RECIBIDA, EN_REVISION, ASIGNADA, EN_PROCESO, RESUELTA, RECHAZADA, CERRADA' };
  }

  const peticion = await peticionesRepository.findPeticionById(idPeticion);

  if (!peticion) {
    throw { status: 404, message: 'Petición no encontrada' };
  }

  if (peticion.Estado === estadoNuevo) {
    throw { status: 400, message: 'El estado nuevo es igual al estado actual' };
  }

  if (peticion.Estado === 'CERRADA') {
    throw { status: 400, message: 'No se puede cambiar el estado de una petición cerrada' };
  }

  if (usuario.rol === 'JEFE_DEPTO') {
    if (!usuario.idDepartamento) {
      throw { status: 403, message: 'El usuario no tiene un departamento asignado' };
    }
    if (peticion.IdDepartamento !== usuario.idDepartamento) {
      throw { status: 403, message: 'No tiene permiso para modificar peticiones de otros departamentos' };
    }
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    await peticionesRepository.updateEstadoPeticion(transaction, idPeticion, estadoNuevo);

    await peticionesRepository.createSeguimiento(transaction, {
      idPeticion,
      idUsuario: usuario.idUsuario,
      estadoAnterior: peticion.Estado,
      estadoNuevo,
      comentario: comentario || null
    });

    await transaction.commit();

    return {
      estadoAnterior: peticion.Estado,
      estadoNuevo
    };

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const listarPeticiones = async (query, usuario) => {
  const { page, limit, estado, prioridad, departamento, fechaInicio, fechaFin, q } = query;
  
  if (page && parseInt(page) < 1) {
    throw { status: 400, message: 'page debe ser mayor o igual a 1' };
  }
  
  if (limit && parseInt(limit) < 1) {
    throw { status: 400, message: 'limit debe ser mayor o igual a 1' };
  }
  
  if (fechaInicio && fechaFin) {
    const regexFecha = /^\d{4}-\d{2}-\d{2}$/;
    if (!regexFecha.test(fechaInicio) || !regexFecha.test(fechaFin)) {
      throw { status: 400, message: 'Formato de fecha inválido. Use YYYY-MM-DD' };
    }
  }
  
  const idDepartamentoUsuario = usuario.rol === 'JEFE_DEPTO' ? usuario.idDepartamento : null;
  
  const filtros = {
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 10,
    estado,
    prioridad,
    departamento: departamento ? parseInt(departamento) : null,
    fechaInicio,
    fechaFin,
    q
  };
  
  const resultado = await peticionesRepository.listPeticiones(filtros, idDepartamentoUsuario);
  return resultado;
};

const obtenerDetallePeticion = async (idPeticion, usuario) => {
  const detalle = await peticionesRepository.getPeticionDetalle(idPeticion);
  
  if (!detalle) {
    throw { status: 404, message: 'Petición no encontrada' };
  }
  
  if (usuario.rol === 'JEFE_DEPTO') {
    if (!usuario.idDepartamento) {
      throw { status: 403, message: 'El usuario no tiene un departamento asignado' };
    }
    if (detalle.departamento.idDepartamento !== usuario.idDepartamento) {
      throw { status: 403, message: 'No tiene permiso para ver peticiones de otros departamentos' };
    }
  }
  
  return detalle;
};

const eliminarPeticion = async (idPeticion) => {
  const peticion = await peticionesRepository.findPeticionById(idPeticion);

  if (!peticion) {
    throw { status: 404, message: 'Petición no encontrada' };
  }

  const eliminada = await peticionesRepository.deletePeticion(idPeticion);

  if (!eliminada) {
    throw { status: 500, message: 'No se pudo eliminar la petición' };
  }

  return { message: 'Petición eliminada exitosamente' };
};

module.exports = {
  crearPeticion,
  cambiarEstadoPeticion,
  listarPeticiones,
  obtenerDetallePeticion,
  eliminarPeticion
};
