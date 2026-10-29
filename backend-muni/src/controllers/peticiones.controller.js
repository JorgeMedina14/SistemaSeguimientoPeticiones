const peticionesService = require('../services/peticiones.service');

const fail = (res, error, fallback) => {
  const status = error.status || 500;
  return res.status(status).json({
    success: false,
    message: error.message || fallback
  });
};

const actor = (req) => ({
  idUsuario: req.user.idUsuario,
  rol: req.user.rol,
  idDepartamento: req.user.idDepartamento
});

const crear = async (req, res) => {
  try {
    const resultado = await peticionesService.crearPeticion(req.body, req.user.idUsuario);
    return res.status(201).json({
      success: true,
      message: 'Petición creada exitosamente',
      data: resultado
    });
  } catch (error) {
    return fail(res, error, 'Error al crear la petición');
  }
};

const cambiarEstado = async (req, res) => {
  try {
    const { estadoNuevo, comentario } = req.body;
    const resultado = await peticionesService.cambiarEstadoPeticion(
      parseInt(req.params.id),
      estadoNuevo,
      comentario,
      actor(req)
    );
    return res.status(200).json({
      success: true,
      message: 'Estado actualizado correctamente',
      estadoAnterior: resultado.estadoAnterior,
      estadoNuevo: resultado.estadoNuevo
    });
  } catch (error) {
    return fail(res, error, 'Error al cambiar el estado de la petición');
  }
};

const listar = async (req, res) => {
  try {
    const resultado = await peticionesService.listarPeticiones(req.query, actor(req));
    return res.status(200).json({
      success: true,
      ...resultado
    });
  } catch (error) {
    return fail(res, error, 'Error al listar peticiones');
  }
};

const obtenerDetalle = async (req, res) => {
  try {
    const detalle = await peticionesService.obtenerDetallePeticion(parseInt(req.params.id), actor(req));
    return res.status(200).json({
      success: true,
      data: detalle
    });
  } catch (error) {
    return fail(res, error, 'Error al obtener detalle de la petición');
  }
};

const eliminar = async (req, res) => {
  try {
    const resultado = await peticionesService.eliminarPeticion(parseInt(req.params.id));
    return res.status(200).json({
      success: true,
      message: resultado.message
    });
  } catch (error) {
    return fail(res, error, 'Error al eliminar la petición');
  }
};

module.exports = {
  crear,
  cambiarEstado,
  listar,
  obtenerDetalle,
  eliminar
};
