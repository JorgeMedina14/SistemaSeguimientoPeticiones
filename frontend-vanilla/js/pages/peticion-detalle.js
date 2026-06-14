// peticion-detalle.js - Controlador de la página de detalle de petición
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Proteger la página y obtener usuario
    const user = await requireAuth();
    if (!user) return;

    // Obtener ID de la petición desde query params
    const urlParams = new URLSearchParams(window.location.search);
    const idPeticion = urlParams.get('id');

    if (!idPeticion) {
      mostrarError('No se especificó el ID de la petición');
      return;
    }

    // Estado de la aplicación
    let peticion = null;

    // Renderizar layout básico
    const mainContent = `
      <div class="page-header">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <h2>Detalle de Petición</h2>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${user.rol === 'ADMIN' || user.rol === 'ALCALDE' ? `
              <button type="button" id="btn-eliminar-peticion" class="btn btn-error">
                Eliminar
              </button>
            ` : ''}
            <a href="peticiones.html" class="btn btn-outline">
              ← Volver al listado
            </a>
          </div>
        </div>
      </div>

      <!-- Contenedor de mensajes -->
      <div id="message-container"></div>

      <!-- Loader -->
      <div id="loader-container" class="hidden">
        <div class="loading-container">
          <div class="spinner"></div>
          <p>Cargando petición...</p>
        </div>
      </div>

      <!-- Contenedor de contenido -->
      <div id="content-container" style="display: none;">
        <!-- Se llenará dinámicamente -->
      </div>
    `;

    renderLayout(user, mainContent);

    const btnEliminar = document.getElementById('btn-eliminar-peticion');
    if (btnEliminar) {
      btnEliminar.addEventListener('click', async () => {
        const codigo = peticion?.codigo || idPeticion;
        if (!confirm(`¿Eliminar la petición "${codigo}"? Esta acción no se puede deshacer.`)) {
          return;
        }

        try {
          btnEliminar.disabled = true;
          await api.delete(`/peticiones/${idPeticion}`);
          alert('Petición eliminada correctamente');
          window.location.href = 'peticiones.html';
        } catch (error) {
          btnEliminar.disabled = false;
          mostrarError(error.message || 'Error al eliminar la petición');
        }
      });
    }

    // Cargar datos de la petición
    await cargarPeticion();

    /**
     * Carga los datos de la petición desde la API
     */
    async function cargarPeticion() {
      try {
        showLoading();
        
        const response = await api.get(`/peticiones/${idPeticion}`);
        peticion = response.data;

        renderContent();
        hideLoading();

      } catch (error) {
        console.error('Error al cargar petición:', error);
        hideLoading();

        if (error.message && error.message.includes('404')) {
          mostrarError('Petición no encontrada');
        } else if (error.message && error.message.includes('403')) {
          mostrarError('No tiene permiso para ver esta petición');
        } else {
          mostrarError('Error al cargar la petición. Por favor, intente nuevamente.');
        }
      }
    }

    /**
     * Renderiza el contenido completo de la petición
     */
    function renderContent() {
      const contentContainer = document.getElementById('content-container');
      
      const html = `
        <div class="detail-grid">
          <!-- Card: Información de la Petición -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">📋 Información de la Petición</h3>
            </div>
            <div class="card-body">
              <div class="detail-row">
                <span class="detail-label">Código:</span>
                <span class="detail-value"><strong>${peticion.codigo}</strong></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Estado:</span>
                <span class="detail-value">
                  <span class="badge badge-${getEstadoBadgeClass(peticion.estado)}">
                    ${formatEstado(peticion.estado)}
                  </span>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Prioridad:</span>
                <span class="detail-value">
                  <span class="badge badge-${getPrioridadBadgeClass(peticion.prioridad)}">
                    ${formatPrioridad(peticion.prioridad)}
                  </span>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Departamento:</span>
                <span class="detail-value">${peticion.departamento.nombre}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Fecha de creación:</span>
                <span class="detail-value">${formatDateTime(peticion.fechaCreacion)}</span>
              </div>
              ${peticion.fechaLimite ? `
                <div class="detail-row">
                  <span class="detail-label">Fecha límite:</span>
                  <span class="detail-value">${formatDateTime(peticion.fechaLimite)}</span>
                </div>
              ` : ''}
              ${peticion.fechaCierre ? `
                <div class="detail-row">
                  <span class="detail-label">Fecha de cierre:</span>
                  <span class="detail-value">${formatDateTime(peticion.fechaCierre)}</span>
                </div>
              ` : ''}
              <div class="detail-row">
                <span class="detail-label">Creado por:</span>
                <span class="detail-value">${peticion.creadoPor || 'N/A'}</span>
              </div>
              <hr>
              <div class="detail-row-full">
                <span class="detail-label">Título:</span>
                <p class="detail-value"><strong>${peticion.titulo}</strong></p>
              </div>
              <div class="detail-row-full">
                <span class="detail-label">Descripción:</span>
                <p class="detail-value" style="white-space: pre-wrap;">${peticion.descripcion}</p>
              </div>
            </div>
          </div>

          <!-- Card: Información del Ciudadano -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">👤 Información del Ciudadano</h3>
            </div>
            <div class="card-body">
              <div class="detail-row">
                <span class="detail-label">DPI:</span>
                <span class="detail-value"><strong>${peticion.ciudadano.dpi}</strong></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Nombres:</span>
                <span class="detail-value">${peticion.ciudadano.nombres}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Apellidos:</span>
                <span class="detail-value">${peticion.ciudadano.apellidos}</span>
              </div>
              ${peticion.ciudadano.telefono ? `
                <div class="detail-row">
                  <span class="detail-label">Teléfono:</span>
                  <span class="detail-value">${peticion.ciudadano.telefono}</span>
                </div>
              ` : ''}
              ${peticion.ciudadano.correo ? `
                <div class="detail-row">
                  <span class="detail-label">Correo:</span>
                  <span class="detail-value">${peticion.ciudadano.correo}</span>
                </div>
              ` : ''}
              ${peticion.ciudadano.direccion ? `
                <div class="detail-row-full">
                  <span class="detail-label">Dirección:</span>
                  <p class="detail-value">${peticion.ciudadano.direccion}</p>
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Cambio de Estado (solo si tiene permisos) -->
        ${renderCambioEstado()}

        <!-- Historial de Seguimientos -->
        <div class="card" style="margin-top: 2rem;">
          <div class="card-header">
            <h3 class="card-title">📜 Historial de Seguimientos</h3>
          </div>
          <div class="card-body">
            ${renderHistorial()}
          </div>
        </div>
      `;

      contentContainer.innerHTML = html;
      contentContainer.style.display = 'block';

      // Agregar event listener al formulario de cambio de estado si existe
      const formCambioEstado = document.getElementById('form-cambio-estado');
      if (formCambioEstado) {
        formCambioEstado.addEventListener('submit', handleCambioEstado);
      }
    }

    /**
     * Renderiza la sección de cambio de estado
     */
    function renderCambioEstado() {
      // Verificar permisos
      if (user.rol === 'RECEPCION') {
        return ''; // RECEPCION no puede cambiar estado
      }

      // Si la petición está cerrada, no permitir cambios
      if (peticion.estado === 'CERRADA') {
        return `
          <div class="card" style="margin-top: 2rem;">
            <div class="card-header">
              <h3 class="card-title">🔒 Cambiar Estado</h3>
            </div>
            <div class="card-body">
              <div class="alert alert-info">
                <strong>Petición cerrada:</strong> No se pueden realizar más cambios de estado.
              </div>
            </div>
          </div>
        `;
      }

      // Estados válidos
      const estados = [
        { value: 'RECIBIDA', label: 'Recibida' },
        { value: 'EN_REVISION', label: 'En Revisión' },
        { value: 'ASIGNADA', label: 'Asignada' },
        { value: 'EN_PROCESO', label: 'En Proceso' },
        { value: 'RESUELTA', label: 'Resuelta' },
        { value: 'RECHAZADA', label: 'Rechazada' },
        { value: 'CERRADA', label: 'Cerrada' }
      ];

      return `
        <div class="card" style="margin-top: 2rem;">
          <div class="card-header">
            <h3 class="card-title">🔄 Cambiar Estado</h3>
          </div>
          <div class="card-body">
            <form id="form-cambio-estado">
              <div class="form-group">
                <label for="nuevo-estado">Nuevo Estado <span class="required">*</span></label>
                <select id="nuevo-estado" name="estadoNuevo" class="form-control" required>
                  <option value="">Seleccione un estado</option>
                  ${estados.map(e => {
                    if (e.value === peticion.estado) return ''; // No mostrar el estado actual
                    return `<option value="${e.value}">${e.label}</option>`;
                  }).join('')}
                </select>
              </div>

              <div class="form-group">
                <label for="comentario">Comentario</label>
                <textarea 
                  id="comentario" 
                  name="comentario" 
                  class="form-control" 
                  rows="4"
                  placeholder="Agregue un comentario sobre el cambio de estado (opcional)"
                ></textarea>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn btn-primary" id="btn-submit-estado">
                  Actualizar Estado
                </button>
              </div>
            </form>
          </div>
        </div>
      `;
    }

    /**
     * Renderiza el historial de seguimientos
     */
    function renderHistorial() {
      if (!peticion.historial || peticion.historial.length === 0) {
        return '<p class="text-muted">No hay seguimientos registrados.</p>';
      }

      return `
        <div class="timeline">
          ${peticion.historial.map(seg => `
            <div class="timeline-item">
              <div class="timeline-marker ${getEstadoBadgeClass(seg.estadoNuevo)}"></div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="badge badge-${getEstadoBadgeClass(seg.estadoNuevo)}">
                    ${formatEstado(seg.estadoNuevo)}
                  </span>
                  <span class="timeline-date">${formatDateTime(seg.fechaMovimiento)}</span>
                </div>
                ${seg.estadoAnterior ? `
                  <div class="timeline-change">
                    <span class="badge badge-outline">${formatEstado(seg.estadoAnterior)}</span>
                    → 
                    <span class="badge badge-${getEstadoBadgeClass(seg.estadoNuevo)}">${formatEstado(seg.estadoNuevo)}</span>
                  </div>
                ` : ''}
                ${seg.comentario ? `
                  <p class="timeline-comment">${seg.comentario}</p>
                ` : ''}
                <p class="timeline-user">
                  <strong>Por:</strong> ${seg.usuario || 'Sistema'}
                </p>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    /**
     * Maneja el submit del formulario de cambio de estado
     */
    async function handleCambioEstado(e) {
      e.preventDefault();

      const formData = new FormData(e.target);
      const estadoNuevo = formData.get('estadoNuevo');
      const comentario = formData.get('comentario');

      // Validar que no sea el mismo estado
      if (estadoNuevo === peticion.estado) {
        mostrarError('El nuevo estado no puede ser igual al estado actual');
        return;
      }

      // Confirmar acción
      if (!confirm(`¿Está seguro que desea cambiar el estado a "${formatEstado(estadoNuevo)}"?`)) {
        return;
      }

      try {
        // Deshabilitar botón
        const btnSubmit = document.getElementById('btn-submit-estado');
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Actualizando...';

        // Llamar a la API
        const payload = { estadoNuevo };
        if (comentario && comentario.trim()) {
          payload.comentario = comentario.trim();
        }

        await api.put(`/peticiones/${idPeticion}/estado`, payload);

        // Mostrar mensaje de éxito
        mostrarExito('Estado actualizado exitosamente');

        // Recargar datos
        await cargarPeticion();

        // Limpiar formulario
        e.target.reset();

      } catch (error) {
        console.error('Error al cambiar estado:', error);
        
        // Rehabilitar botón
        const btnSubmit = document.getElementById('btn-submit-estado');
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = 'Actualizar Estado';
        }

        if (error.message && error.message.includes('403')) {
          mostrarError('No tiene permiso para cambiar el estado de esta petición');
        } else if (error.message && error.message.includes('400')) {
          mostrarError('Datos inválidos. Verifique el estado seleccionado.');
        } else {
          mostrarError('Error al actualizar el estado. Por favor, intente nuevamente.');
        }
      }
    }

    /**
     * Muestra el loader
     */
    function showLoading() {
      document.getElementById('loader-container').classList.remove('hidden');
      document.getElementById('content-container').style.display = 'none';
    }

    /**
     * Oculta el loader
     */
    function hideLoading() {
      document.getElementById('loader-container').classList.add('hidden');
    }

    /**
     * Muestra un mensaje de error
     */
    function mostrarError(mensaje) {
      const container = document.getElementById('message-container');
      container.innerHTML = `
        <div class="alert alert-error">
          ${mensaje}
        </div>
      `;
      setTimeout(() => {
        container.innerHTML = '';
      }, 5000);
    }

    /**
     * Muestra un mensaje de éxito
     */
    function mostrarExito(mensaje) {
      const container = document.getElementById('message-container');
      container.innerHTML = `
        <div class="alert alert-success">
          ${mensaje}
        </div>
      `;
      // Scroll hacia arriba para ver el mensaje
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        container.innerHTML = '';
      }, 3000);
    }

    /**
     * Obtiene la clase CSS para el badge de estado
     */
    function getEstadoBadgeClass(estado) {
      const classes = {
        'RECIBIDA': 'info',
        'EN_REVISION': 'warning',
        'ASIGNADA': 'info',
        'EN_PROCESO': 'warning',
        'RESUELTA': 'success',
        'RECHAZADA': 'error',
        'CERRADA': 'default'
      };
      return classes[estado] || 'default';
    }

    /**
     * Formatea el estado para mostrar
     */
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
     * Formatea una fecha y hora
     */
    function formatDateTime(dateString) {
      if (!dateString) return '---';
      const date = new Date(dateString);
      return date.toLocaleString('es-GT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

  } catch (error) {
    console.error('Error al cargar página de detalle:', error);
    auth.logout();
  }
});
