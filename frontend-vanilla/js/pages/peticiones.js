// peticiones.js - Controlador de la página de peticiones
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Proteger la página y obtener usuario
    const user = await requireAuth();
    if (!user) return;

    // Estado de la aplicación
    let state = {
      peticiones: [],
      currentPage: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      filters: {
        estado: '',
        prioridad: '',
        q: ''
      },
      loading: false
    };

    // Construir el contenido específico de peticiones
    const mainContent = `
      <div class="page-header">
        <h2>Gestión de Peticiones</h2>
      </div>

      <!-- Filtros -->
      <div class="card">
        <div class="card-body">
          <form id="filters-form" class="filters-form">
            <div class="form-row">
              <div class="form-group">
                <label for="filter-search">Buscar</label>
                <input 
                  type="text" 
                  id="filter-search" 
                  name="q" 
                  class="form-control" 
                  placeholder="Código, título o DPI..."
                >
              </div>

              <div class="form-group">
                <label for="filter-estado">Estado</label>
                <select id="filter-estado" name="estado" class="form-control">
                  <option value="">Todos</option>
                  <option value="RECIBIDA">Recibida</option>
                  <option value="EN_REVISION">En Revisión</option>
                  <option value="ASIGNADA">Asignada</option>
                  <option value="EN_PROCESO">En Proceso</option>
                  <option value="RESUELTA">Resuelta</option>
                  <option value="RECHAZADA">Rechazada</option>
                  <option value="CERRADA">Cerrada</option>
                </select>
              </div>

              <div class="form-group">
                <label for="filter-prioridad">Prioridad</label>
                <select id="filter-prioridad" name="prioridad" class="form-control">
                  <option value="">Todas</option>
                  <option value="BAJA">Baja</option>
                  <option value="MEDIA">Media</option>
                  <option value="ALTA">Alta</option>
                </select>
              </div>

              <div class="form-group" style="display: flex; align-items: flex-end; gap: 0.5rem;">
                <button type="submit" class="btn btn-primary">
                  🔍 Buscar
                </button>
                <button type="button" id="btn-clear-filters" class="btn btn-outline">
                  Limpiar
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Contenedor de mensajes -->
      <div id="message-container"></div>

      <!-- Loader -->
      <div id="loader-container" class="hidden">
        <div class="loading-container">
          <div class="spinner"></div>
          <p>Cargando peticiones...</p>
        </div>
      </div>

      <!-- Tabla de peticiones -->
      <div id="table-container" class="card">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Título</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                  <th>Departamento</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="peticiones-tbody">
                <tr>
                  <td colspan="7" class="text-center text-muted">
                    No hay peticiones para mostrar
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Paginación -->
          <div id="pagination-container" class="pagination-container hidden">
            <div class="pagination-info">
              <span id="pagination-info-text">Mostrando 0 de 0 peticiones</span>
            </div>
            <div class="pagination-controls">
              <button id="btn-prev-page" class="btn btn-outline btn-sm" disabled>
                ← Anterior
              </button>
              <span id="pagination-pages" class="pagination-pages">
                Página <span id="current-page">1</span> de <span id="total-pages">1</span>
              </span>
              <button id="btn-next-page" class="btn btn-outline btn-sm" disabled>
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Renderizar el layout con el contenido
    renderLayout(user, mainContent);

    // Inicializar la página
    initPeticionesPage();

    /**
     * Inicializa la página de peticiones
     */
    function initPeticionesPage() {
      // Event listeners
      document.getElementById('filters-form').addEventListener('submit', handleFilterSubmit);
      document.getElementById('btn-clear-filters').addEventListener('click', handleClearFilters);
      document.getElementById('btn-prev-page').addEventListener('click', () => goToPage(state.currentPage - 1));
      document.getElementById('btn-next-page').addEventListener('click', () => goToPage(state.currentPage + 1));

      // Cargar peticiones iniciales
      loadPeticiones();
    }

    /**
     * Carga las peticiones desde la API
     */
    async function loadPeticiones() {
      if (state.loading) return;

      try {
        state.loading = true;
        showLoading();

        // Construir query params
        const params = new URLSearchParams({
          page: state.currentPage,
          limit: state.limit
        });

        // Agregar filtros si existen
        if (state.filters.estado) params.append('estado', state.filters.estado);
        if (state.filters.prioridad) params.append('prioridad', state.filters.prioridad);
        if (state.filters.q) params.append('q', state.filters.q);

        // Llamar a la API
        const response = await api.get(`/peticiones?${params.toString()}`);

        // Actualizar estado
        state.peticiones = response.data || [];
        state.total = response.total || 0;
        state.totalPages = response.totalPages || 1;
        state.currentPage = response.page || 1;

        // Renderizar tabla
        renderTable();
        renderPagination();

        hideLoading();
      } catch (error) {
        console.error('Error al cargar peticiones:', error);
        hideLoading();
        showMessage('Error al cargar las peticiones. Por favor, intente nuevamente.', 'error');
      } finally {
        state.loading = false;
      }
    }

    /**
     * Renderiza la tabla de peticiones
     */
    function renderTable() {
      const tbody = document.getElementById('peticiones-tbody');
      
      if (state.peticiones.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center text-muted">
              No se encontraron peticiones
            </td>
          </tr>
        `;
        return;
      }

      const puedeEliminar = user.rol === 'ADMIN' || user.rol === 'ALCALDE';

      tbody.innerHTML = state.peticiones.map(peticion => `
        <tr>
          <td><strong>${peticion.codigo || peticion.codigoPeticion || '---'}</strong></td>
          <td>
            <a href="peticion-detalle.html?id=${peticion.idPeticion}" class="link">
              ${peticion.titulo}
            </a>
          </td>
          <td>
            <span class="badge badge-${getEstadoBadgeClass(peticion.estado)}">
              ${formatEstado(peticion.estado)}
            </span>
          </td>
          <td>
            <span class="badge badge-${getPrioridadBadgeClass(peticion.prioridad)}">
              ${formatPrioridad(peticion.prioridad)}
            </span>
          </td>
          <td>${peticion.departamento || 'Sin asignar'}</td>
          <td>${formatDate(peticion.fechaCreacion)}</td>
          <td>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <a href="peticion-detalle.html?id=${peticion.idPeticion}" class="btn btn-sm btn-outline">
                Ver
              </a>
              ${puedeEliminar ? `
                <button type="button" class="btn btn-sm btn-error" onclick="eliminarPeticion(${peticion.idPeticion}, '${(peticion.codigo || '').replace(/'/g, "\\'")}')">
                  Eliminar
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `).join('');
    }

    /**
     * Renderiza la paginación
     */
    function renderPagination() {
      const paginationContainer = document.getElementById('pagination-container');
      const infoText = document.getElementById('pagination-info-text');
      const currentPageSpan = document.getElementById('current-page');
      const totalPagesSpan = document.getElementById('total-pages');
      const btnPrev = document.getElementById('btn-prev-page');
      const btnNext = document.getElementById('btn-next-page');

      if (state.total > 0) {
        paginationContainer.classList.remove('hidden');

        // Calcular rango de items
        const startItem = ((state.currentPage - 1) * state.limit) + 1;
        const endItem = Math.min(state.currentPage * state.limit, state.total);

        infoText.textContent = `Mostrando ${startItem}-${endItem} de ${state.total} peticiones`;
        currentPageSpan.textContent = state.currentPage;
        totalPagesSpan.textContent = state.totalPages;

        // Habilitar/deshabilitar botones
        btnPrev.disabled = state.currentPage <= 1;
        btnNext.disabled = state.currentPage >= state.totalPages;
      } else {
        paginationContainer.classList.add('hidden');
      }
    }

    /**
     * Navega a una página específica
     */
    function goToPage(page) {
      if (page < 1 || page > state.totalPages) return;
      state.currentPage = page;
      loadPeticiones();
    }

    /**
     * Maneja el submit del formulario de filtros
     */
    function handleFilterSubmit(e) {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      state.filters = {
        estado: formData.get('estado') || '',
        prioridad: formData.get('prioridad') || '',
        q: formData.get('q') || ''
      };

      // Resetear a página 1
      state.currentPage = 1;
      loadPeticiones();
    }

    /**
     * Limpia los filtros
     */
    function handleClearFilters() {
      document.getElementById('filters-form').reset();
      state.filters = {
        estado: '',
        prioridad: '',
        q: ''
      };
      state.currentPage = 1;
      loadPeticiones();
    }

    /**
     * Muestra el loader
     */
    function showLoading() {
      document.getElementById('loader-container').classList.remove('hidden');
      document.getElementById('table-container').style.opacity = '0.5';
    }

    /**
     * Oculta el loader
     */
    function hideLoading() {
      document.getElementById('loader-container').classList.add('hidden');
      document.getElementById('table-container').style.opacity = '1';
    }

    /**
     * Muestra un mensaje
     */
    function showMessage(message, type = 'info') {
      const container = document.getElementById('message-container');
      container.innerHTML = `
        <div class="alert alert-${type}">
          ${message}
        </div>
      `;
      setTimeout(() => {
        container.innerHTML = '';
      }, 5000);
    }

    /**
     * Obtiene la clase CSS para el badge de estado
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

    function formatEstado(estado) {
      const estados = {
        'RECIBIDA': 'Recibida',
        'EN_REVISION': 'En Revisión',
        'ASIGNADA': 'Asignada',
        'EN_PROCESO': 'En Proceso',
        'RESUELTA': 'Resuelta',
        'RECHAZADA': 'Rechazada',
        'CERRADA': 'Cerrada'
      };
      return estados[estado] || estado;
    }

    window.eliminarPeticion = async function(idPeticion, codigo) {
      const etiqueta = codigo ? ` "${codigo}"` : '';
      if (!confirm(`¿Eliminar la petición${etiqueta}? Esta acción no se puede deshacer.`)) {
        return;
      }

      try {
        await api.delete(`/peticiones/${idPeticion}`);
        showMessage('Petición eliminada correctamente', 'success');
        await loadPeticiones();
      } catch (error) {
        showMessage(error.message || 'Error al eliminar la petición', 'error');
      }
    };

    /**
     * Obtiene la clase CSS para el badge de prioridad
     */
    function getPrioridadBadgeClass(prioridad) {
      const classes = {
        'BAJA': 'default',
        'MEDIA': 'info',
        'ALTA': 'warning',
        'URGENTE': 'error'
      };
      return classes[prioridad] || 'default';
    }

    /**
     * Formatea la prioridad para mostrar
     */
    function formatPrioridad(prioridad) {
      const prioridades = {
        'BAJA': 'Baja',
        'MEDIA': 'Media',
        'ALTA': 'Alta',
        'URGENTE': 'Urgente'
      };
      return prioridades[prioridad] || prioridad;
    }

    /**
     * Formatea una fecha
     */
    function formatDate(dateString) {
      if (!dateString) return '---';
      const date = new Date(dateString);
      return date.toLocaleDateString('es-GT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }

  } catch (error) {
    console.error('Error al cargar página de peticiones:', error);
    auth.logout();
  }
});
