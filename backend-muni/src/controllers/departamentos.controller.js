const departamentosService = require('../services/departamentos.service');

const listar = async (req, res) => {
  try {
    const departamentos = await departamentosService.listarDepartamentos();
    res.status(200).json({
      success: true,
      data: departamentos
    });
  } catch (error) {
    console.error('Error al listar departamentos:', error);
    res.status(500).json({
      success: false,
      mensaje: error.message || 'Error al obtener departamentos'
    });
  }
};

module.exports = {
  listar
};
