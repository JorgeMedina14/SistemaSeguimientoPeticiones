import api from './axiosConfig';

export const getDashboard = (params) => api.get('/reportes/dashboard', { params });
export const getResumen = (params) => api.get('/reportes/resumen', { params });
export const getPorDepartamento = (params) => api.get('/reportes/por-departamento', { params });
export const getTiempos = (params) => api.get('/reportes/tiempos', { params });
export const getCiudadanosFrecuentes = (params) =>
  api.get('/reportes/ciudadanos-frecuentes', { params });
