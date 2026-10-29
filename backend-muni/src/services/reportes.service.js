const reportesRepository = require('../repositories/reportes.repository');

const validarFechas = (fechaInicio, fechaFin) => {
  if (!fechaInicio && !fechaFin) {
    return { fechaInicio: null, fechaFin: null };
  }
  
  if (fechaInicio && !fechaFin) {
    throw { status: 400, message: 'Si proporciona fechaInicio, debe proporcionar fechaFin' };
  }
  
  if (!fechaInicio && fechaFin) {
    throw { status: 400, message: 'Si proporciona fechaFin, debe proporcionar fechaInicio' };
  }
  
  const regexFecha = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!regexFecha.test(fechaInicio)) {
    throw { status: 400, message: 'Formato de fechaInicio inválido. Use YYYY-MM-DD' };
  }
  
  if (!regexFecha.test(fechaFin)) {
    throw { status: 400, message: 'Formato de fechaFin inválido. Use YYYY-MM-DD' };
  }
  
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  
  if (isNaN(inicio.getTime())) {
    throw { status: 400, message: 'fechaInicio no es una fecha válida' };
  }
  
  if (isNaN(fin.getTime())) {
    throw { status: 400, message: 'fechaFin no es una fecha válida' };
  }
  
  if (inicio > fin) {
    throw { status: 400, message: 'fechaInicio no puede ser mayor que fechaFin' };
  }
  
  return { fechaInicio, fechaFin };
};

const obtenerResumen = async (fechaInicio, fechaFin) => {
  validarFechas(fechaInicio, fechaFin);

  const resumen = await reportesRepository.getResumenGeneral(fechaInicio, fechaFin);
  
  let porcentajeResueltas = 0;
  let porcentajePendientes = 0;
  
  if (resumen.totalPeticiones > 0) {
    porcentajeResueltas = parseFloat(((resumen.totalResueltas / resumen.totalPeticiones) * 100).toFixed(1));
    porcentajePendientes = parseFloat(((resumen.totalPendientes / resumen.totalPeticiones) * 100).toFixed(1));
  }
  
  const tiempos = await reportesRepository.getTiemposPromedio(fechaInicio, fechaFin);
  
  return {
    totalPeticiones: resumen.totalPeticiones,
    porcentajeResueltas,
    porcentajePendientes,
    promedioDiasResolucion: tiempos.promedioDias,
    porEstado: resumen.porEstado,
    porPrioridad: resumen.porPrioridad
  };
};

const obtenerPorDepartamento = async (fechaInicio, fechaFin) => {
  validarFechas(fechaInicio, fechaFin);
  return reportesRepository.getPorDepartamento(fechaInicio, fechaFin);
};

const obtenerTiempos = async (fechaInicio, fechaFin) => {
  validarFechas(fechaInicio, fechaFin);
  return reportesRepository.getTiemposPromedio(fechaInicio, fechaFin);
};

const obtenerCiudadanosFrecuentes = async (query) => {
  const { top, page, limit, fechaInicio, fechaFin, estado, q } = query;
  
  if (fechaInicio && fechaFin) {
    validarFechas(fechaInicio, fechaFin);
  }
  
  const topNum = top ? parseInt(top, 10) : null;
  const pageNum = page ? parseInt(page, 10) : null;
  const limitNum = limit ? parseInt(limit, 10) : null;
  
  if (topNum && topNum < 1) {
    throw { status: 400, message: 'top debe ser mayor o igual a 1' };
  }
  
  if (pageNum && pageNum < 1) {
    throw { status: 400, message: 'page debe ser mayor o igual a 1' };
  }
  
  if (limitNum && limitNum < 1) {
    throw { status: 400, message: 'limit debe ser mayor o igual a 1' };
  }
  
  return reportesRepository.getCiudadanosFrecuentes({
    top: topNum,
    page: pageNum,
    limit: limitNum,
    fechaInicio,
    fechaFin,
    estado,
    q
  });
};

const obtenerDashboard = async (fechaInicio, fechaFin) => {
  validarFechas(fechaInicio, fechaFin);
  return reportesRepository.getDashboardOverview(fechaInicio, fechaFin);
};

module.exports = {
  obtenerResumen,
  obtenerPorDepartamento,
  obtenerTiempos,
  obtenerCiudadanosFrecuentes,
  obtenerDashboard
};
