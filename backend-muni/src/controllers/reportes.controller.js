const reportesService = require('../services/reportes.service');

const resumen = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const datos = await reportesService.obtenerResumen(fechaInicio, fechaFin);
    
    return res.status(200).json({
      success: true,
      data: datos
    });
    
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || 'Error al obtener resumen de peticiones';
    
    return res.status(status).json({
      success: false,
      message
    });
  }
};

const porDepartamento = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const datos = await reportesService.obtenerPorDepartamento(fechaInicio, fechaFin);
    
    return res.status(200).json({
      success: true,
      data: datos
    });
    
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || 'Error al obtener reporte por departamento';
    
    return res.status(status).json({
      success: false,
      message
    });
  }
};

const tiempos = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const datos = await reportesService.obtenerTiempos(fechaInicio, fechaFin);
    
    return res.status(200).json({
      success: true,
      data: datos
    });
    
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || 'Error al obtener tiempos promedio';
    
    return res.status(status).json({
      success: false,
      message
    });
  }
};

const ciudadanosFrecuentes = async (req, res) => {
  try {
    const resultado = await reportesService.obtenerCiudadanosFrecuentes(req.query);
    
    return res.status(200).json({
      success: true,
      ...resultado
    });
    
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || 'Error al obtener ciudadanos frecuentes';
    
    return res.status(status).json({
      success: false,
      message
    });
  }
};

const dashboard = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const datos = await reportesService.obtenerDashboard(fechaInicio, fechaFin);
    
    return res.status(200).json({
      success: true,
      data: datos
    });
    
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || 'Error al obtener dashboard';
    console.error('Error en controller.reportes.dashboard:', error);
    
    return res.status(status).json({
      success: false,
      message
    });
  }
};

module.exports = {
  resumen,
  porDepartamento,
  tiempos,
  ciudadanosFrecuentes,
  dashboard
};
