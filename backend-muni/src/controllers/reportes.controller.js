const reportesService = require('../services/reportes.service');

const fail = (res, error, fallback) => {
  const status = error.status || 500;
  return res.status(status).json({
    success: false,
    message: error.message || fallback
  });
};

const withFechas = (fn, fallback) => async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const datos = await fn(fechaInicio, fechaFin);
    return res.status(200).json({
      success: true,
      data: datos
    });
  } catch (error) {
    return fail(res, error, fallback);
  }
};

const resumen = withFechas(reportesService.obtenerResumen, 'Error al obtener resumen de peticiones');
const porDepartamento = withFechas(reportesService.obtenerPorDepartamento, 'Error al obtener reporte por departamento');
const tiempos = withFechas(reportesService.obtenerTiempos, 'Error al obtener tiempos promedio');
const dashboard = withFechas(async (fechaInicio, fechaFin) => {
  try {
    return await reportesService.obtenerDashboard(fechaInicio, fechaFin);
  } catch (error) {
    console.error('Error en controller.reportes.dashboard:', error);
    throw error;
  }
}, 'Error al obtener dashboard');

const ciudadanosFrecuentes = async (req, res) => {
  try {
    const resultado = await reportesService.obtenerCiudadanosFrecuentes(req.query);
    return res.status(200).json({
      success: true,
      ...resultado
    });
  } catch (error) {
    return fail(res, error, 'Error al obtener ciudadanos frecuentes');
  }
};

module.exports = {
  resumen,
  porDepartamento,
  tiempos,
  ciudadanosFrecuentes,
  dashboard
};
