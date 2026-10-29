import api from './axiosConfig';

export const listUsuarios = (params) => api.get('/usuarios', { params });
export const getUsuario = (id) => api.get(`/usuarios/${id}`);
export const createUsuario = (payload) => api.post('/usuarios', payload);
export const updateUsuario = (id, payload) => api.put(`/usuarios/${id}`, payload);
export const toggleUsuarioActivo = (id, activo) =>
  api.patch(`/usuarios/${id}/activo`, { activo });
export const changePassword = (id, nuevaPassword) =>
  api.patch(`/usuarios/${id}/password`, { nuevaPassword });
export const deleteUsuario = (id) => api.delete(`/usuarios/${id}`);
