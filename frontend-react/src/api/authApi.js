import api from './axiosConfig';

export const loginRequest = (username, password) =>
  api.post('/auth/login', { username, password });

export const getMe = () => api.get('/auth/me');
