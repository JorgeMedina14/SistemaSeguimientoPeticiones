// api.js - Servicio para peticiones HTTP
const API_BASE_URL = 'http://localhost:5000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Obtiene el token de autenticación del localStorage
   */
  getAuthToken() {
    return localStorage.getItem('token');
  }

  /**
   * Genera los headers para las peticiones
   */
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Realiza una petición HTTP genérica
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: this.getHeaders(options.auth !== false)
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        const error = new Error(
          errorPayload?.message || errorPayload?.mensaje || `Error ${response.status}`
        );
        error.status = response.status;
        error.response = {
          status: response.status,
          data: errorPayload
        };
        throw error;
      }

      const data = await response.json().catch(() => null);
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'GET'
    });
  }

  /**
   * POST request
   */
  async post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  /**
   * PATCH request
   */
  async patch(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'DELETE'
    });
  }
}

// Exportar instancia única
const api = new ApiService();
