// dashboard.js - Panel Ejecutivo (ADMIN y ALCALDE)

// =============================================
// ESTADO GLOBAL
// =============================================
let currentUser = null;
let dashboardData = null;
let dashboardPreviousData = null;
let filtros = {
  fechaInicio: '',
  fechaFin: ''
 };

// =============================================
// INICIALIZACIÓN
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Verificar autenticación
    currentUser = await requireAuth();
    if (!currentUser) return;

    // Verificar que sea ADMIN o ALCALDE
    if (currentUser.rol !== 'ADMIN' && currentUser.rol !== 'ALCALDE') {
      alert('Acceso denegado. Este panel es solo para Administradores y Alcalde.');
      window.location.href = '/pages/peticiones.html';
      return;
    }

    // Renderizar layout
    const mainContent = buildMainContent();
    renderLayout(currentUser, mainContent);

    // Inicializar eventos
    initEventHandlers();

    // Cargar datos iniciales
    await cargarDashboard();
    
  } catch (error) {
    console.error('Error en inicialización:', error);
    showError('Error al cargar el dashboard');
  }
});

// =============================================
// API CALLS
// =============================================

/**
 * Carga los datos del dashboard desde la API
 */
async function cargarDashboard() {
  try {
    showLoader();
    
    // Construir query params para periodo actual
    const currentParams = new URLSearchParams();
    if (filtros.fechaInicio) currentParams.append('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) currentParams.append('fechaFin', filtros.fechaFin);
    
    // Calcular periodo anterior de la misma duración
    const previousPeriod = calcularPeriodoAnterior(filtros.fechaInicio, filtros.fechaFin);
    const previousParams = new URLSearchParams();
    if (previousPeriod.fechaInicio) previousParams.append('fechaInicio', previousPeriod.fechaInicio);
    if (previousPeriod.fechaFin) previousParams.append('fechaFin', previousPeriod.fechaFin);
    
    // Cargar datos del dashboard actual y del periodo anterior
    const [currentResponse, previousResponse] = await Promise.all([
      api.get(`/reportes/dashboard?${currentParams.toString()}`),
      api.get(`/reportes/dashboard?${previousParams.toString()}`)
    ]);
    
    dashboardData = currentResponse.data;
    dashboardPreviousData = previousResponse.data;
    
    // Renderizar datos
    renderMetricas();
    renderTablas();
    hideLoader();
    
  } catch (error) {
    console.error('Error al cargar dashboard:', error);
    hideLoader();
    showError('Error al cargar los datos del dashboard');
  }
}

// =============================================
// RENDERIZADO
// =============================================

/**
 * Construye el contenido principal del dashboard
 */
function buildMainContent() {
  return `
    <div class="container dashboard-container">
      <!-- Header -->
      <div class="page-header">
        <h2>Panel Ejecutivo</h2>
        <p class="text-muted">Vista general del sistema de peticiones</p>
      </div>

      <!-- Filtros -->
      <div class="card">
        <div class="card-body">
          <form id="form-filtros" class="filters-form" onsubmit="handleFiltrar(event)">
            <div class="form-row">
              <div class="form-group">
                <label for="fechaInicio">Fecha Inicio</label>
                <input 
                  type="date" 
                  id="fechaInicio" 
                  name="fechaInicio" 
                  class="form-control"
                  value="${filtros.fechaInicio}">
              </div>
              
              <div class="form-group">
                <label for="fechaFin">Fecha Fin</label>
                <input 
                  type="date" 
                  id="fechaFin" 
                  name="fechaFin" 
                  class="form-control"
                  value="${filtros.fechaFin}">
              </div>
              
              <div class="form-group" style="display: flex; align-items: flex-end; gap: 0.5rem;">
                <button type="submit" class="btn btn-primary">
                  🔍 Filtrar
                </button>
                <button type="button" class="btn btn-secondary" onclick="limpiarFiltros()">
                  ✖ Limpiar
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Loader -->
      <div id="loader-dashboard" class="hidden" style="text-align: center; padding: 2rem;">
        <div class="spinner"></div>
        <p>Cargando datos...</p>
      </div>

      <!-- Mensajes -->
      <div id="error-container" class="hidden"></div>
      <div id="success-container" class="hidden"></div>

      <!-- Métricas -->
      <div id="metricas-container" class="metricas-grid">
        ${renderMetricasPlaceholder()}
      </div>

      <!-- Tablas -->
      <div id="tablas-container" class="tablas-grid">
        ${renderTablasPlaceholder()}
      </div>
    </div>
  `;
}

/**
 * Renderiza placeholder para métricas
 */
function renderMetricasPlaceholder() {
  return `
    <div class="metric-card">
      <div class="metric-value">-</div>
      <div class="metric-label">Total Peticiones</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">-</div>
      <div class="metric-label">% Resueltas</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">-</div>
      <div class="metric-label">% Pendientes</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">-</div>
      <div class="metric-label">Promedio Días</div>
    </div>
  `;
}

/**
 * Renderiza placeholder para tablas
 */
function renderTablasPlaceholder() {
  return `
    <div class="card">
      <div class="card-header">
        <h3>Por Estado</h3>
      </div>
      <div class="card-body">
        <p class="text-muted">Cargando...</p>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h3>Por Departamento</h3>
      </div>
      <div class="card-body">
        <p class="text-muted">Cargando...</p>
      </div>
    </div>
  `;
}

/**
 * Renderiza las métricas con datos reales
 */
function renderMetricas() {
  if (!dashboardData) return;
  
  const container = document.getElementById('metricas-container');
  if (!container) return;
  
  const { totalPeticiones, porcentajeResueltas, porcentajePendientes, promedioDiasResolucion } = dashboardData;
  
  container.innerHTML = `
    <div class="metric-card metric-primary">
      <div class="metric-value">${totalPeticiones || 0}</div>
      <div class="metric-label">Total Peticiones</div>
    </div>
    
    <div class="metric-card metric-success">
      <div class="metric-value">${(porcentajeResueltas || 0).toFixed(1)}%</div>
      <div class="metric-label">Resueltas</div>
    </div>
    
    <div class="metric-card metric-warning">
      <div class="metric-value">${(porcentajePendientes || 0).toFixed(1)}%</div>
      <div class="metric-label">Pendientes</div>
    </div>
    
    <div class="metric-card metric-info">
      <div class="metric-value">${(promedioDiasResolucion || 0).toFixed(1)}</div>
      <div class="metric-label">Promedio Días</div>
    </div>
    <div class="metric-card metric-secondary">
      <div class="metric-value">${formatDelta(porcentajeResueltas, dashboardPreviousData?.porcentajeResueltas)}</div>
      <div class="metric-label">Cambio % Resueltas</div>
    </div>
  `;
}

/**
 * Renderiza todas las tablas
 */
function renderTablas() {
  if (!dashboardData) return;
  
  const container = document.getElementById('tablas-container');
  if (!container) return;
  
  container.innerHTML = `
    <!-- Por Estado -->
    <div class="card">
      <div class="card-header">
        <h3>Peticiones por Estado</h3>
      </div>
      <div class="card-body">
        ${renderTablaPorEstado()}
      </div>
    </div>
    
    <!-- Por Departamento -->
    <div class="card">
      <div class="card-header">
        <h3>Peticiones por Departamento</h3>
      </div>
      <div class="card-body">
        ${renderTablaPorDepartamento()}
      </div>
    </div>
    
    <!-- Top Ciudadanos -->
    <div class="card">
      <div class="card-header">
        <h3>Ciudadanos Frecuentes (Top 5)</h3>
      </div>
      <div class="card-body">
        ${renderTablaCiudadanosFrecuentes()}
      </div>
    </div>
    
    <!-- Últimos Movimientos -->
    <div class="card card-wide">
      <div class="card-header">
        <h3>Últimos 10 Movimientos</h3>
      </div>
      <div class="card-body">
        ${renderTablaUltimosMovimientos()}
      </div>
    </div>
  `;
}

/**
 * Renderiza tabla de peticiones por estado
 */
function renderTablaPorEstado() {
  const totalPorEstado = dashboardData.porEstado || [];
  
  if (totalPorEstado.length === 0) {
    return '<p class="text-muted">No hay datos disponibles</p>';
  }
  
  const rows = totalPorEstado.map(item => `
    <tr>
      <td><span class="badge badge-${getEstadoBadgeClass(item.estado)}">${formatEstado(item.estado)}</span></td>
      <td style="text-align: right;"><strong>${item.total}</strong></td>
    </tr>
  `).join('');
  
  return `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Estado</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Renderiza tabla de peticiones por departamento
 */
function renderTablaPorDepartamento() {
  const totalPorDepartamento = dashboardData.porDepartamento || [];
  
  if (totalPorDepartamento.length === 0) {
    return '<p class="text-muted">No hay datos disponibles</p>';
  }
  
  const rows = totalPorDepartamento.map(item => `
    <tr>
      <td>${escapeHtml(item.departamento)}</td>
      <td style="text-align: right;"><strong>${item.total}</strong></td>
    </tr>
  `).join('');
  
  return `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Departamento</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Renderiza tabla de ciudadanos frecuentes
 */
function renderTablaCiudadanosFrecuentes() {
  const ciudadanos = dashboardData.top5CiudadanosFrecuentes || [];
  
  if (ciudadanos.length === 0) {
    return '<p class="text-muted">No hay datos disponibles</p>';
  }
  
  const rows = ciudadanos.map((c, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(c.nombreCompleto || 'Sin nombre')}</td>
      <td>${c.idCiudadano || 'N/A'}</td>
      <td style="text-align: center;"><strong>${c.totalPeticiones || 0}</strong></td>
    </tr>
  `).join('');
  
  return `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 50px;">#</th>
            <th>Nombre</th>
            <th>ID Ciudadano</th>
            <th style="text-align: center;">Peticiones</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Renderiza tabla de últimos movimientos
 */
function renderTablaUltimosMovimientos() {
  const movimientos = dashboardData.ultimos10Movimientos || [];
  
  if (movimientos.length === 0) {
    return '<p class="text-muted">No hay movimientos recientes</p>';
  }
  
  const rows = movimientos.map(mov => `
    <tr>
      <td><span class="badge badge-outline">${escapeHtml(mov.codigo || 'N/A')}</span></td>
      <td class="cell-comentario">${escapeHtml(mov.comentario || 'Sin comentario')}</td>
      <td><span class="badge badge-${getEstadoBadgeClass(mov.estadoNuevo)}">${formatEstado(mov.estadoNuevo)}</span></td>
      <td class="cell-fecha">${formatFechaHora(mov.fechaMovimiento)}</td>
      <td>
        <a href="peticion-detalle.html?id=${mov.idPeticion}" class="btn btn-sm btn-secondary">
          Ver
        </a>
      </td>
    </tr>
  `).join('');
  
  return `
    <div class="table-container table-container--wide">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Comentario</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

// =============================================
// EVENT HANDLERS
// =============================================

/**
 * Inicializa los event handlers
 */
function initEventHandlers() {
  // Event listener para cerrar sesión desde el botón del layout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.logout();
    });
  }
}

/**
 * Maneja el envío del formulario de filtros
 */
async function handleFiltrar(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  filtros.fechaInicio = formData.get('fechaInicio') || '';
  filtros.fechaFin = formData.get('fechaFin') || '';
  
  // Validar fechas
  if (filtros.fechaInicio && filtros.fechaFin) {
    if (new Date(filtros.fechaInicio) > new Date(filtros.fechaFin)) {
      showError('La fecha de inicio no puede ser mayor a la fecha fin');
      return;
    }
  }
  
  await cargarDashboard();
}

/**
 * Limpia los filtros y recarga datos
 */
async function limpiarFiltros() {
  filtros.fechaInicio = '';
  filtros.fechaFin = '';
  
  document.getElementById('fechaInicio').value = '';
  document.getElementById('fechaFin').value = '';
  
  await cargarDashboard();
}

// =============================================
// UTILIDADES
// =============================================

/**
 * Muestra el loader
 */
function showLoader() {
  const loader = document.getElementById('loader-dashboard');
  if (loader) {
    loader.classList.remove('hidden');
  }
}

/**
 * Oculta el loader
 */
function hideLoader() {
  const loader = document.getElementById('loader-dashboard');
  if (loader) {
    loader.classList.add('hidden');
  }
}

/**
 * Obtiene la clase de badge según el estado
 */
function getEstadoBadgeClass(estado) {
  const classes = {
    'RECIBIDA': 'info',
    'EN_REVISION': 'info',
    'ASIGNADA': 'primary',
    'EN_PROCESO': 'warning',
    'RESUELTA': 'success',
    'RECHAZADA': 'error',
    'CERRADA': 'default'
  };
  return classes[estado] || 'default';
}

/**
 * Formatea el nombre del estado
 */
function formatEstado(estado) {
  const nombres = {
    'RECIBIDA': 'Recibida',
    'EN_REVISION': 'En Revisión',
    'ASIGNADA': 'Asignada',
    'EN_PROCESO': 'En Proceso',
    'RESUELTA': 'Resuelta',
    'RECHAZADA': 'Rechazada',
    'CERRADA': 'Cerrada'
  };
  return nombres[estado] || estado;
}

/**
 * Formatea una fecha
 */
function formatFecha(fecha) {
  if (!fecha) return '-';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-GT', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
}

/**
 * Formatea una fecha con hora
 */
function formatFechaHora(fecha) {
  if (!fecha) return '-';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-GT', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calcula el periodo anterior con la misma duración que el rango actual
 */
function calcularPeriodoAnterior(fechaInicio, fechaFin) {
  const now = new Date();
  if (!fechaInicio || !fechaFin) {
    const fin = new Date(now);
    const inicio = new Date(now);
    inicio.setDate(inicio.getDate() - 29);
    const anteriorFin = new Date(inicio);
    anteriorFin.setDate(anteriorFin.getDate() - 1);
    const anteriorInicio = new Date(anteriorFin);
    anteriorInicio.setDate(anteriorInicio.getDate() - 29);
    return {
      fechaInicio: anteriorInicio.toISOString().slice(0, 10),
      fechaFin: anteriorFin.toISOString().slice(0, 10)
    };
  }

  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const delta = fin.getTime() - inicio.getTime();
  const anteriorFin = new Date(inicio.getTime() - 1);
  const anteriorInicio = new Date(anteriorFin.getTime() - delta);

  return {
    fechaInicio: anteriorInicio.toISOString().slice(0, 10),
    fechaFin: anteriorFin.toISOString().slice(0, 10)
  };
}

/**
 * Formatea el cambio porcentual entre dos valores
 */
function formatDelta(actual, anterior) {
  if (typeof actual !== 'number' || typeof anterior !== 'number') {
    return '-';
  }

  const delta = actual - anterior;
  const sign = delta > 0 ? '+' : delta < 0 ? '' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
