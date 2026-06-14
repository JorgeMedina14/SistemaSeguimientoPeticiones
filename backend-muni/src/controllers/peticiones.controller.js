const peticionesService = require('../services/peticiones.service');

const crear = async (req, res) => {
  try {
    const idUsuario = req.user.idUsuario;
    const data = req.body;

    const resultado = await peticionesService.crearPeticion(data, idUsuario);

    return res.status(201).json({
      success: true,
      message: 'Petición creada exitosamente',
      data: resultado
    });

  } catch (error) {
    const status = error.status || 500;
    const message = error.message || 'Error al crear la petición';

    return res.status(status).json({
      success: false,
      message
    });
  }
};

const cambiarEstado = async (req, res) => {
  try {
    const idPeticion = parseInt(req.params.id);
    const { estadoNuevo, comentario } = req.body;
    const usuario = {
      idUsuario: req.user.idUsuario,
      rol: req.user.rol,
      idDepartamento: req.user.idDepartamento
    };

    const resultado = await peticionesService.cambiarEstadoPeticion(idPeticion, estadoNuevo, comentario, usuario);

    return res.status(200).json({
      success: true,
      message: 'Estado actualizado correctamente',
      estadoAnterior: resultado.estadoAnterior,
      estadoNuevo: resultado.estadoNuevo
    });

  } catch (error) {
    const status = error.status || 500;
    const message = error.message || 'Error al cambiar el estado de la petición';

    return res.status(status).json({
      success: false,
      message
    });
  }
};

const listar = async (req, res) => {
  try {
    const usuario = {
      rol: req.user.rol,
      idDepartamento: req.user.idDepartamento
    };
    
    const resultado = await peticionesService.listarPeticiones(req.query, usuario);
    
    return res.status(200).json({
      success: true,
      ...resultado
    });
    
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || 'Error al listar peticiones';
    
    return res.status(status).json({
      success: false,
      message
    });
  }
};

const obtenerDetalle = async (req, res) => {
  try {
    const idPeticion = parseInt(req.params.id);
    const usuario = {
      rol: req.user.rol,
      idDepartamento: req.user.idDepartamento
    };
    
    const detalle = await peticionesService.obtenerDetallePeticion(idPeticion, usuario);
    
    return res.status(200).json({
      success: true,
      data: detalle
    });
    
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || 'Error al obtener detalle de la petición';
    
    return res.status(status).json({
      success: false,
      message
    });
  }
};

const eliminar = async (req, res) => {
  try {
    const idPeticion = parseInt(req.params.id);
    const resultado = await peticionesService.eliminarPeticion(idPeticion);
    
    return res.status(200).json({
      success: true,
      message: resultado.message
    });
    
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || 'Error al eliminar la petición';
    
    return res.status(status).json({
      success: false,
      message
    });
  }
};

module.exports = {
  crear,
  cambiarEstado,
  listar,
  obtenerDetalle,
  eliminar
};
