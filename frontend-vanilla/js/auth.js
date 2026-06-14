// auth.js - Servicio de autenticación
class AuthService {
  constructor() {
    this.tokenKey = 'token';
    this.userKey = 'user';
  }

  /**
   * Realiza login y guarda el token
   */
  async login(username, password) {
    try {
      const response = await api.post('/auth/login', 
        { username, password },
        { auth: false }
      );

      // El backend devuelve: { success, message, data: { token, user } }
      if (response.data && response.data.token) {
        // Guardar token
        localStorage.setItem(this.tokenKey, response.data.token);
        
        // Guardar usuario si viene en la respuesta
        if (response.data.user) {
          // Normalizar el usuario (nombreCompleto -> nombre)
          const user = {
            ...response.data.user,
            nombre: response.data.user.nombreCompleto || response.data.user.nombre
          };
          localStorage.setItem(this.userKey, JSON.stringify(user));
        }
        
        return response.data;
      }

      throw new Error('No se recibió token de autenticación');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Cierra sesión
   */
  logout() {
    this.clearSession();
    window.location.href = '/pages/login.html';
  }

  /**
   * Obtiene el token actual
   */
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Verifica si hay un token
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Obtiene el usuario actual desde localStorage
   */
  getCurrentUserFromStorage() {
    const userStr = localStorage.getItem(this.userKey);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  /**
   * Obtiene el usuario actual desde la API con caché en sessionStorage
   */
  async getMe() {
    try {
      // Intentar obtener desde sessionStorage primero (caché de sesión)
      const cachedUser = sessionStorage.getItem('currentUser');
      if (cachedUser) {
        try {
          return JSON.parse(cachedUser);
        } catch (e) {
          // Si falla el parse, continuar con la llamada a la API
        }
      }

      // Llamar a la API
      const response = await api.get('/auth/me');
      // El backend devuelve: { success, data: { usuario } }
      if (response.data) {
        // Normalizar el usuario (nombreCompleto -> nombre)
        const user = {
          ...response.data,
          nombre: response.data.nombreCompleto || response.data.nombre
        };
        // Guardar en sessionStorage para el caché
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        // También actualizar localStorage
        localStorage.setItem(this.userKey, JSON.stringify(user));
        return user;
      }
      throw new Error('No se recibió información del usuario');
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      // Si falla, limpiar sesión
      this.clearSession();
      throw error;
    }
  }

  /**
   * Limpia la sesión (sessionStorage + localStorage)
   */
  clearSession() {
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  /**
   * Obtiene el usuario actual desde la API (alias de getMe)
   * @deprecated Usar getMe() en su lugar
   */
  async getCurrentUser() {
    return this.getMe();
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role) {
    const user = this.getCurrentUserFromStorage();
    return user && user.rol === role;
  }

  /**
   * Verifica si el usuario tiene alguno de los roles especificados
   */
  hasAnyRole(roles = []) {
    const user = this.getCurrentUserFromStorage();
    return user && roles.includes(user.rol);
  }
}

// Exportar instancia única
const auth = new AuthService();
