import api from './axiosConfig';

export const listDepartamentos = () => api.get('/departamentos');
