// ui.js - Utilidades de interfaz de usuario
/**
 * Muestra un mensaje de error
 */
function showError(message, containerId = 'error-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="alert alert-error">
      ${message}
    </div>
  `;
  container.classList.remove('hidden');

  // Auto-ocultar después de 5 segundos
  setTimeout(() => {
    hideError(containerId);
  }, 5000);
}

/**
 * Oculta el mensaje de error
 */
function hideError(containerId = 'error-container') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  container.classList.add('hidden');
}

/**
 * Muestra un mensaje de éxito
 */
function showSuccess(message, containerId = 'success-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="alert alert-success">
      ${message}
    </div>
  `;
  container.classList.remove('hidden');

  // Auto-ocultar después de 3 segundos
  setTimeout(() => {
    hideSuccess(containerId);
  }, 3000);
}

/**
 * Oculta el mensaje de éxito
 */
function hideSuccess(containerId = 'success-container') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  container.classList.add('hidden');
}

/**
 * Muestra un loader en un botón
 */
function showButtonLoader(buttonId) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  button.disabled = true;
  const originalText = button.innerHTML;
  button.dataset.originalText = originalText;
  button.innerHTML = `
    <span class="spinner-small"></span>
    Cargando...
  `;
}

/**
 * Oculta el loader de un botón
 */
function hideButtonLoader(buttonId) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  button.disabled = false;
  if (button.dataset.originalText) {
    button.innerHTML = button.dataset.originalText;
    delete button.dataset.originalText;
  }
}

/**
 * Muestra un loader general en la página
 */
function showLoader(containerId = 'loader-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="loading-container">
      <div class="spinner"></div>
    </div>
  `;
  container.classList.remove('hidden');
}

/**
 * Oculta el loader general
 */
function hideLoader(containerId = 'loader-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';
  container.classList.add('hidden');
}

/**
 * Actualiza información del usuario en el header
 */
function updateUserInfo(user) {
  const userName = document.getElementById('user-name');
  const userRole = document.getElementById('user-role');
  const userAvatar = document.getElementById('user-avatar');

  if (userName) {
    userName.textContent = user.nombre;
  }

  if (userRole) {
    userRole.textContent = user.rol;
  }

  if (userAvatar) {
    const initials = user.nombre
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
    userAvatar.textContent = initials;
  }
}

/**
 * Formatea una fecha a formato local
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-GT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formatea fecha y hora
 */
function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('es-GT', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Marca el elemento activo en el sidebar
 */
function setActiveSidebarLink() {
  const currentPath = window.location.pathname;
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  
  sidebarLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentPath.includes(href)) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/**
 * Construye el menú según el rol del usuario
 */
function buildMenu(rol) {
  const allMenuItems = [
    {
      href: 'dashboard.html',
      icon: '📊',
      label: 'Dashboard',
      roles: ['ADMIN', 'ALCALDE', 'JEFE_DEPTO', 'RECEPCION']
    },
    {
      href: 'peticiones.html',
      icon: '📋',
      label: 'Peticiones',
      roles: ['ADMIN', 'ALCALDE', 'JEFE_DEPTO', 'RECEPCION']
    },
    {
      href: 'nueva-peticion.html',
      icon: '➕',
      label: 'Nueva Petición',
      roles: ['RECEPCION', 'ALCALDE']
    },
    {
      href: 'usuarios.html',
      icon: '👥',
      label: 'Usuarios',
      roles: ['ADMIN']
    },
    {
      href: 'reportes.html',
      icon: '📈',
      label: 'Reportes',
      roles: ['ADMIN', 'ALCALDE']
    }
  ];

  // Filtrar items según el rol
  return allMenuItems.filter(item => item.roles.includes(rol));
}

/**
 * Renderiza el layout completo (header + sidebar + main) dentro de #app
 */
function renderLayout(user, mainContent = '') {
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    console.error('No se encontró el contenedor #app');
    return;
  }

  // Obtener items del menú según el rol
  const menuItems = buildMenu(user.rol);

  // Construir los items del menú
  const menuHTML = menuItems.map(item => `
    <li class="sidebar-item">
      <a href="${item.href}" class="sidebar-link">
        <span class="sidebar-icon">${item.icon}</span>
        <span>${item.label}</span>
      </a>
    </li>
  `).join('');

  // Construir el layout completo
  const layoutHTML = `
    <!-- Header -->
    <header class="header">
      <div class="header-container">
        <div class="header-left">
          <div class="header-logo">
            <h1>🏛️ Sistema de Peticiones</h1>
            <p>Municipalidad de Jalapa</p>
          </div>
        </div>

        <div class="header-right">
          <div class="user-info">
            <div class="user-details">
              <span id="user-name" class="user-name">${user.nombre || user.nombreCompleto}</span>
              <span id="user-role" class="user-role">${user.rol}</span>
            </div>
            <div id="user-avatar" class="user-avatar">${getInitials(user.nombre || user.nombreCompleto)}</div>
          </div>
          <button id="logout-btn" class="btn btn-outline">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>

    <!-- Sidebar -->
    <aside class="sidebar">
      <nav class="sidebar-nav">
        <ul class="sidebar-menu">
          ${menuHTML}
        </ul>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      ${mainContent}
    </main>
  `;

  // Insertar el layout
  appContainer.innerHTML = layoutHTML;

  // Marcar el link activo
  setActiveSidebarLink();

  // Agregar evento al botón de logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('¿Está seguro que desea cerrar sesión?')) {
        auth.logout();
      }
    });
  }
}

/**
 * Obtiene las iniciales de un nombre
 */
function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}
