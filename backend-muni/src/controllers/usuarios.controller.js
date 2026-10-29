const usuariosService = require('../services/usuarios.service');

const fail = (res, error, status = 400) => {
  res.status(status).json({
    success: false,
    mensaje: error.message
  });
};

const failUsuario = (res, error) =>
  fail(res, error, error.message === 'Usuario no encontrado' ? 404 : 400);

const crear = async (req, res) => {
  try {
    const nuevoUsuario = await usuariosService.crearUsuario(req.body);
    res.status(201).json({
      success: true,
      data: nuevoUsuario,
      mensaje: 'Usuario creado exitosamente'
    });
  } catch (error) {
    fail(res, error);
  }
};

const listar = async (req, res) => {
  try {
    const resultado = await usuariosService.listarUsuarios(req.query);
    res.status(200).json({
      success: true,
      ...resultado
    });
  } catch (error) {
    fail(res, error);
  }
};

const obtenerPorId = async (req, res) => {
  try {
    const usuario = await usuariosService.obtenerUsuarioPorId(parseInt(req.params.id));
    res.status(200).json({
      success: true,
      data: usuario
    });
  } catch (error) {
    failUsuario(res, error);
  }
};

const actualizar = async (req, res) => {
  try {
    const usuarioActualizado = await usuariosService.actualizarUsuario(
      parseInt(req.params.id),
      req.body,
      req.user
    );
    res.status(200).json({
      success: true,
      data: usuarioActualizado,
      mensaje: 'Usuario actualizado exitosamente'
    });
  } catch (error) {
    failUsuario(res, error);
  }
};

const cambiarActivo = async (req, res) => {
  try {
    const { activo } = req.body;

    if (activo === undefined) {
      return res.status(400).json({
        success: false,
        mensaje: 'El campo activo es requerido'
      });
    }

    const resultado = await usuariosService.cambiarActivoUsuario(
      parseInt(req.params.id),
      activo,
      req.user
    );
    res.status(200).json({
      success: true,
      data: resultado,
      mensaje: 'Estado del usuario actualizado exitosamente'
    });
  } catch (error) {
    failUsuario(res, error);
  }
};

const cambiarPassword = async (req, res) => {
  try {
    const { nuevaPassword } = req.body;

    if (!nuevaPassword) {
      return res.status(400).json({
        success: false,
        mensaje: 'El campo nuevaPassword es requerido'
      });
    }

    const resultado = await usuariosService.cambiarPasswordUsuario(
      parseInt(req.params.id),
      nuevaPassword
    );
    res.status(200).json({
      success: true,
      mensaje: resultado.mensaje
    });
  } catch (error) {
    failUsuario(res, error);
  }
};

const eliminar = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.idUsuario) {
      return res.status(400).json({
        success: false,
        mensaje: 'No puedes eliminar tu propia cuenta'
      });
    }

    const resultado = await usuariosService.eliminarUsuario(parseInt(id), req.user);
    res.status(200).json({
      success: true,
      mensaje: resultado.mensaje
    });
  } catch (error) {
    failUsuario(res, error);
  }
};

module.exports = {
  crear,
  listar,
  obtenerPorId,
  actualizar,
  cambiarActivo,
  cambiarPassword,
  eliminar
};
