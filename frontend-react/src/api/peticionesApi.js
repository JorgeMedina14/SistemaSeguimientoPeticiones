import api from './axiosConfig';

export const listPeticiones = (params) => api.get('/peticiones', { params });
export const getPeticion = (id) => api.get(`/peticiones/${id}`);
export const createPeticion = (payload) => api.post('/peticiones', payload);
export const updateEstado = (id, payload) => api.put(`/peticiones/${id}/estado`, payload);
export const deletePeticion = (id) => api.delete(`/peticiones/${id}`);
