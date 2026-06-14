// guards.js - Protección de rutas
/**
 * Requiere autenticación para acceder a la página
 * Valida el token y obtiene el usuario desde la API
 */
async function requireAuth() {
  if (!auth.isAuthenticated()) {
    // Guardar la URL actual para redirigir después del login
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    window.location.href = '/pages/login.html';
    return null;
  }

  try {
    // Validar token obteniendo el usuario desde la API
    const user = await auth.getMe();
    return user;
  } catch (error) {
    console.error('Error en requireAuth:', error);
    // Si falla, redirigir a login
    auth.logout();
    return null;
  }
}

/**
 * Requiere roles específicos para acceder
 */
async function requireRole(allowedRoles = []) {
  // Primero verificar autenticación y obtener usuario
  const user = await requireAuth();
  if (!user) {
    return null;
  }

  // Verificar rol
  if (!allowedRoles.includes(user.rol)) {
    alert('No tienes permisos para acceder a esta página');
    window.location.href = '/pages/dashboard.html';
    return null;
  }

  return user;
}

/**
 * Requiere rol ADMIN para acceder
 * Redirige a dashboard si no es ADMIN
 */
async function requireAdmin() {
  const user = await requireAuth();
  if (!user) {
    return null;
  }

  if (user.rol !== 'ADMIN') {
    alert('Acceso denegado. Esta página es solo para Administradores.');
    window.location.href = '/pages/dashboard.html';
    return null;
  }

  return user;
}

/**
 * Protege una página específica
 */
function protectPage(requiredRoles = null) {
  // Si se especifican roles, verificar rol
  if (requiredRoles && requiredRoles.length > 0) {
    return requireRole(requiredRoles);
  }
  
  // Si no, solo verificar autenticación
  return requireAuth();
}

/**
 * Redirige al dashboard si ya está autenticado (para login)
 */
function redirectIfAuthenticated() {
  if (auth.isAuthenticated()) {
    window.location.href = '/pages/dashboard.html';
    return true;
  }
  return false;
}
