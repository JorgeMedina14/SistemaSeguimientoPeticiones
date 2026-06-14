// login.js - Controlador de la página de login
document.addEventListener('DOMContentLoaded', function() {
  // Si ya está autenticado, redirigir al dashboard
  if (auth.isAuthenticated()) {
    window.location.href = '/pages/dashboard.html';
    return;
  }

  // Obtener elementos del DOM
  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('login-btn');

  // Manejar submit del formulario
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Obtener valores
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    // Validación básica
    if (!username || !password) {
      showError('Por favor complete todos los campos');
      return;
    }

    // Limpiar errores previos
    hideError();

    // Mostrar loader
    showButtonLoader('login-btn');

    try {
      // Intentar login
      const response = await auth.login(username, password);

      // Login exitoso
      console.log('Login exitoso:', response);

      // Verificar si hay una URL de redirección guardada
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin');

      // Redirigir
      window.location.href = redirectUrl || '/pages/dashboard.html';

    } catch (error) {
      // Mostrar error
      showError(error.message || 'Error al iniciar sesión');
      
      // Ocultar loader
      hideButtonLoader('login-btn');

      // Limpiar contraseña por seguridad
      passwordInput.value = '';
      passwordInput.focus();
    }
  });

  // Focus automático en el campo de usuario
  usernameInput.focus();
});
