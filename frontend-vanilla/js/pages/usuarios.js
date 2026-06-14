// usuarios.js - Gestión de Usuarios (ADMIN)

// =============================================
// ESTADO GLOBAL
// =============================================
let currentUser = null;
let usuarios = [];
let departamentos = [];
let editingUserId = null; // ID del usuario que se está editando

// =============================================
// INICIALIZACIÓN
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Verificar autenticación y que sea ADMIN
    currentUser = await requireAdmin();
    if (!currentUser) {
      return; // requireAdmin ya redirige si no es ADMIN
    }

    // Cargar departamentos y usuarios
    await Promise.all([
      cargarDepartamentos(),
      cargarUsuarios()
    ]);

    // Construir contenido principal
    const mainContent = buildMainContent();
    
    // Renderizar layout completo con header, menú y contenido
    renderLayout(currentUser, mainContent);
    
    // Inicializar eventos después de renderizar
    initEventHandlers();
    
  } catch (error) {
    console.error('Error en inicialización:', error);
    showError('Error al cargar la página');
  }
});

// =============================================
// API CALLS
// =============================================

/**
 * Carga la lista de departamentos
 */
async function cargarDepartamentos() {
  try {
    // Intentar cargar desde API
    const response = await api.get('/departamentos');
    departamentos = response.data || [];
  } catch (error) {
    console.warn('Endpoint /departamentos no disponible, usando datos hardcodeados');
    // Fallback: departamentos hardcodeados basados en la BD
    departamentos = [
      { idDepartamento: 3, nombre: 'Jalapagua' },
      { idDepartamento: 2, nombre: 'Empresa Eléctrica' },
      { idDepartamento: 1, nombre: 'Obras Municipales' }
    ];
  }
}

/**
 * Carga la lista de usuarios
 */
async function cargarUsuarios() {
  try {
    const response = await api.get('/usuarios');
    usuarios = response.data || [];
    renderTablaUsuarios();
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    showError('Error al cargar la lista de usuarios');
    usuarios = [];
  }
}

/**
 * Carga un usuario específico
 */
async function cargarUsuario(id) {
  try {
    const response = await api.get(`/usuarios/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al cargar usuario:', error);
    showError('Error al cargar el usuario');
    return null;
  }
}

/**
 * Crea un nuevo usuario
 */
async function crearUsuario(data) {
  try {
    await api.post('/usuarios', data);
    showSuccess('Usuario creado exitosamente');
    await cargarUsuarios();
    cerrarModal('modal-usuario');
  } catch (error) {
    console.error('Error al crear usuario:', error);
    const message = error.response?.data?.mensaje || error.message || 'Error al crear usuario';
    showError(message);
  }
}

/**
 * Actualiza un usuario existente
 */
async function actualizarUsuario(id, data) {
  try {
    await api.put(`/usuarios/${id}`, data);
    showSuccess('Usuario actualizado exitosamente');
    await cargarUsuarios();
    cerrarModal('modal-usuario');
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    const message = error.response?.data?.mensaje || error.message || 'Error al actualizar usuario';
    showError(message);
  }
}

/**
 * Cambia el estado activo de un usuario
 */
async function toggleActivo(id, activoActual) {
  try {
    // Verificar que no se esté desactivando a sí mismo
    if (id === currentUser.idUsuario && activoActual) {
      showError('No puedes desactivar tu propia cuenta');
      return;
    }

    const nuevoEstado = !activoActual;
    await api.patch(`/usuarios/${id}/activo`, { activo: nuevoEstado });
    
    const mensaje = nuevoEstado ? 'Usuario activado' : 'Usuario desactivado';
    showSuccess(mensaje);
    
    await cargarUsuarios();
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    const message = error.response?.data?.mensaje || error.message || 'Error al cambiar el estado del usuario';
    showError(message);
  }
}

/**
 * Cambia la contraseña de un usuario
 */
async function cambiarPassword(id, nuevaPassword) {
  try {
    await api.patch(`/usuarios/${id}/password`, { nuevaPassword });
    showSuccess('Contraseña actualizada exitosamente');
    cerrarModal('modal-password');
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    const message = error.response?.data?.mensaje || error.message || 'Error al cambiar la contraseña';
    showError(message);
  }
}

/**
 * Elimina un usuario (solo ADMIN)
 */
async function confirmarEliminarUsuario(id, username) {
  if (id === currentUser.idUsuario) {
    showError('No puedes eliminar tu propia cuenta');
    return;
  }

  if (!confirm(`¿Eliminar al usuario "${username}"? Esta acción no se puede deshacer.`)) {
    return;
  }

  try {
    await api.delete(`/usuarios/${id}`);
    showSuccess('Usuario eliminado correctamente');
    await cargarUsuarios();
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    const message = error.response?.data?.mensaje || error.message || 'Error al eliminar usuario';
    showError(message);
  }
}

// =============================================
// RENDERIZADO
// =============================================

/**
 * Construye el contenido principal de la página (sin header ni menú)
 */
function buildMainContent() {
  return `
    <div class="container">
      <!-- Mensajes -->
      <div id="error-container" class="hidden"></div>
      <div id="success-container" class="hidden"></div>
      
      <!-- Card principal -->
      <div class="card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <h2>Gestión de Usuarios</h2>
          <button class="btn btn-accent" onclick="abrirModalCrear()">
            <span>+</span> Nuevo Usuario
          </button>
        </div>
        
        <div class="card-body">
          <div id="tabla-usuarios-container">
            ${renderTablaUsuarios()}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modales -->
    ${renderModalUsuario()}
    ${renderModalPassword()}
  `;
}

/**
 * Inicializa los event handlers después de renderizar
 */
function initEventHandlers() {
  // Event listener para cerrar modales al hacer clic fuera
  document.getElementById('modal-usuario')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-usuario') {
      cerrarModal('modal-usuario');
    }
  });
  
  document.getElementById('modal-password')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-password') {
      cerrarModal('modal-password');
    }
  });
}

/**
 * Renderiza la tabla de usuarios
 */
function renderTablaUsuarios() {
  if (usuarios.length === 0) {
    return `
      <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-muted);">
        <p>No hay usuarios registrados</p>
      </div>
    `;
  }

  const rows = usuarios.map(usuario => `
    <tr>
      <td>${escapeHtml(usuario.username)}</td>
      <td>${escapeHtml(usuario.nombreCompleto)}</td>
      <td><span class="badge badge-${getRolBadgeClass(usuario.rol)}">${formatRol(usuario.rol)}</span></td>
      <td>${usuario.departamentoNombre ? escapeHtml(usuario.departamentoNombre) : '<span class="text-muted">—</span>'}</td>
      <td>
        <span class="badge badge-${usuario.activo ? 'success' : 'error'}">
          ${usuario.activo ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td>
        <div style="display: flex; gap: var(--spacing-xs); flex-wrap: wrap;">
          <button 
            class="btn btn-sm btn-secondary" 
            onclick="abrirModalEditar(${usuario.idUsuario})"
            title="Editar usuario">
            Editar
          </button>
          <button 
            class="btn btn-sm ${usuario.activo ? 'btn-error' : 'btn-success'}" 
            onclick="confirmarToggleActivo(${usuario.idUsuario}, ${usuario.activo})"
            title="${usuario.activo ? 'Desactivar' : 'Activar'} usuario"
            ${usuario.idUsuario === currentUser.idUsuario ? 'disabled' : ''}>
            ${usuario.activo ? 'Desactivar' : 'Activar'}
          </button>
          <button 
            class="btn btn-sm btn-warning" 
            onclick="abrirModalPassword(${usuario.idUsuario}, '${escapeHtml(usuario.username)}')"
            title="Cambiar contraseña">
            Password
          </button>
          <button 
            class="btn btn-sm btn-error" 
            onclick="confirmarEliminarUsuario(${usuario.idUsuario}, '${escapeHtml(usuario.username)}')"
            title="Eliminar usuario"
            ${usuario.idUsuario === currentUser.idUsuario ? 'disabled' : ''}>
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  const html = `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Nombre Completo</th>
            <th>Rol</th>
            <th>Departamento</th>
            <th>Estado</th>
            <th style="width: 320px;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;

  // Si se llama desde cargarUsuarios, actualizar solo el contenedor
  const container = document.getElementById('tabla-usuarios-container');
  if (container) {
    container.innerHTML = html;
  }

  return html;
}

/**
 * Renderiza el modal de crear/editar usuario
 */
function renderModalUsuario() {
  return `
    <div id="modal-usuario" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="modal-usuario-title">Nuevo Usuario</h3>
          <button class="modal-close" onclick="cerrarModal('modal-usuario')">&times;</button>
        </div>
        <div class="modal-body">
          <!-- Mensajes del modal -->
          <div id="modal-error" class="hidden"></div>
          
          <form id="form-usuario" onsubmit="handleSubmitUsuario(event)">
            <div class="form-group">
              <label for="username">Usuario <span class="required">*</span></label>
              <input 
                type="text" 
                id="username" 
                name="username" 
                class="form-control" 
                required 
                minlength="4"
                placeholder="Ingrese el nombre de usuario">
              <small class="form-text">Mínimo 4 caracteres</small>
            </div>

            <div class="form-group">
              <label for="nombreCompleto">Nombre Completo <span class="required">*</span></label>
              <input 
                type="text" 
                id="nombreCompleto" 
                name="nombreCompleto" 
                class="form-control" 
                required
                placeholder="Ingrese el nombre completo">
            </div>

            <div class="form-group" id="password-group">
              <label for="password">Contraseña <span class="required">*</span></label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                class="form-control" 
                required 
                minlength="6"
                placeholder="Ingrese la contraseña">
              <small class="form-text">Mínimo 6 caracteres</small>
            </div>

            <div class="form-group">
              <label for="rol">Rol <span class="required">*</span></label>
              <select id="rol" name="rol" class="form-control" required onchange="handleRolChange()">
                <option value="">Seleccione un rol</option>
                <option value="ADMIN">Administrador</option>
                <option value="ALCALDE">Alcalde</option>
                <option value="JEFE_DEPTO">Jefe de Departamento</option>
                <option value="RECEPCION">Recepción</option>
              </select>
            </div>

            <div class="form-group" id="departamento-group" style="display: none;">
              <label for="idDepartamento">Departamento <span class="required">*</span></label>
              <select id="idDepartamento" name="idDepartamento" class="form-control">
                <option value="">Seleccione un departamento</option>
                ${departamentos.map(d => `
                  <option value="${d.idDepartamento}">${escapeHtml(d.nombre)}</option>
                `).join('')}
              </select>
              <small class="form-text">Requerido solo para Jefes de Departamento</small>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onclick="cerrarModal('modal-usuario')">
                Cancelar
              </button>
              <button type="submit" class="btn btn-accent" id="btn-guardar-usuario">
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renderiza el modal de cambio de contraseña
 */
function renderModalPassword() {
  return `
    <div id="modal-password" class="modal" style="display: none;">
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <h3>Cambiar Contraseña</h3>
          <button class="modal-close" onclick="cerrarModal('modal-password')">&times;</button>
        </div>
        <div class="modal-body">
          <div id="modal-password-error" class="hidden"></div>
          
          <p style="margin-bottom: var(--spacing-md); color: var(--text-muted);">
            Usuario: <strong id="password-username"></strong>
          </p>
          
          <form id="form-password" onsubmit="handleSubmitPassword(event)">
            <input type="hidden" id="password-user-id" value="">
            
            <div class="form-group">
              <label for="nueva-password">Nueva Contraseña <span class="required">*</span></label>
              <input 
                type="password" 
                id="nueva-password" 
                name="password" 
                class="form-control" 
                required 
                minlength="6"
                placeholder="Ingrese la nueva contraseña">
              <small class="form-text">Mínimo 6 caracteres</small>
            </div>

            <div class="form-group">
              <label for="confirmar-password">Confirmar Contraseña <span class="required">*</span></label>
              <input 
                type="password" 
                id="confirmar-password" 
                name="confirmar" 
                class="form-control" 
                required 
                minlength="6"
                placeholder="Confirme la contraseña">
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onclick="cerrarModal('modal-password')">
                Cancelar
              </button>
              <button type="submit" class="btn btn-accent">
                Cambiar Contraseña
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

// =============================================
// MANEJADORES DE EVENTOS
// =============================================

/**
 * Actualiza las opciones del select de departamentos
 */
function actualizarSelectDepartamentos() {
  const select = document.getElementById('idDepartamento');
  if (!select) return;
  
  // Limpiar opciones existentes excepto la primera
  select.innerHTML = '<option value="">Seleccione un departamento</option>';
  
  // Agregar departamentos
  departamentos.forEach(d => {
    const option = document.createElement('option');
    option.value = d.idDepartamento;
    option.textContent = d.nombre;
    select.appendChild(option);
  });
}

/**
 * Abre el modal para crear un nuevo usuario
 */
function abrirModalCrear() {
  editingUserId = null;
  
  // Actualizar título
  document.getElementById('modal-usuario-title').textContent = 'Nuevo Usuario';
  
  // Resetear formulario
  const form = document.getElementById('form-usuario');
  form.reset();
  
  // Actualizar select de departamentos
  actualizarSelectDepartamentos();
  
  // Mostrar campo de contraseña y hacerlo requerido
  const passwordGroup = document.getElementById('password-group');
  const passwordInput = document.getElementById('password');
  passwordGroup.style.display = 'block';
  passwordInput.required = true;
  
  // Ocultar departamento inicialmente
  document.getElementById('departamento-group').style.display = 'none';
  document.getElementById('idDepartamento').required = false;
  
  // Ocultar mensajes de error
  document.getElementById('modal-error').classList.add('hidden');
  
  // Mostrar modal
  document.getElementById('modal-usuario').style.display = 'flex';
}

/**
 * Abre el modal para editar un usuario existente
 */
async function abrirModalEditar(id) {
  editingUserId = id;
  
  // Cargar datos del usuario
  const usuario = await cargarUsuario(id);
  if (!usuario) return;
  
  // Actualizar título
  document.getElementById('modal-usuario-title').textContent = 'Editar Usuario';
  
  // Actualizar select de departamentos
  actualizarSelectDepartamentos();
  
  // Llenar formulario
  document.getElementById('username').value = usuario.username;
  document.getElementById('nombreCompleto').value = usuario.nombreCompleto;
  document.getElementById('rol').value = usuario.rol;
  
  // Ocultar campo de contraseña en edición
  const passwordGroup = document.getElementById('password-group');
  const passwordInput = document.getElementById('password');
  passwordGroup.style.display = 'none';
  passwordInput.required = false;
  passwordInput.value = '';
  
  // Mostrar/ocultar departamento según rol
  const departamentoGroup = document.getElementById('departamento-group');
  const departamentoSelect = document.getElementById('idDepartamento');
  
  if (usuario.rol === 'JEFE_DEPTO') {
    departamentoGroup.style.display = 'block';
    departamentoSelect.required = true;
    departamentoSelect.value = usuario.idDepartamento || '';
  } else {
    departamentoGroup.style.display = 'none';
    departamentoSelect.required = false;
    departamentoSelect.value = '';
  }
  
  // Ocultar mensajes de error
  document.getElementById('modal-error').classList.add('hidden');
  
  // Mostrar modal
  document.getElementById('modal-usuario').style.display = 'flex';
}

/**
 * Maneja el cambio de rol en el formulario
 */
function handleRolChange() {
  const rol = document.getElementById('rol').value;
  const departamentoGroup = document.getElementById('departamento-group');
  const departamentoSelect = document.getElementById('idDepartamento');
  
  if (rol === 'JEFE_DEPTO') {
    departamentoGroup.style.display = 'block';
    departamentoSelect.required = true;
  } else {
    departamentoGroup.style.display = 'none';
    departamentoSelect.required = false;
    departamentoSelect.value = '';
  }
}

/**
 * Maneja el envío del formulario de usuario
 */
async function handleSubmitUsuario(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  
  // Construir objeto de datos
  const data = {
    username: formData.get('username').trim(),
    nombreCompleto: formData.get('nombreCompleto').trim(),
    rol: formData.get('rol')
  };
  
  // Agregar contraseña solo si es creación (no edición)
  if (editingUserId === null) {
    data.password = formData.get('password');
  }
  
  // Agregar departamento si el rol es JEFE_DEPTO
  if (data.rol === 'JEFE_DEPTO') {
    const idDepartamento = formData.get('idDepartamento');
    if (!idDepartamento) {
      showModalError('Debe seleccionar un departamento para Jefes de Departamento');
      return;
    }
    data.idDepartamento = parseInt(idDepartamento);
  }
  
  // Validaciones adicionales
  if (data.username.length < 4) {
    showModalError('El nombre de usuario debe tener al menos 4 caracteres');
    return;
  }
  
  if (data.password && data.password.length < 6) {
    showModalError('La contraseña debe tener al menos 6 caracteres');
    return;
  }
  
  // Deshabilitar botón de guardar
  const btnGuardar = document.getElementById('btn-guardar-usuario');
  btnGuardar.disabled = true;
  btnGuardar.textContent = 'Guardando...';
  
  try {
    if (editingUserId === null) {
      // Crear nuevo usuario
      await crearUsuario(data);
    } else {
      // Actualizar usuario existente
      await actualizarUsuario(editingUserId, data);
    }
  } finally {
    // Re-habilitar botón
    btnGuardar.disabled = false;
    btnGuardar.textContent = 'Guardar';
  }
}

/**
 * Confirma el cambio de estado activo
 */
function confirmarToggleActivo(id, activoActual) {
  const accion = activoActual ? 'desactivar' : 'activar';
  const usuario = usuarios.find(u => u.idUsuario === id);
  
  if (!usuario) return;
  
  const mensaje = `¿Está seguro de ${accion} al usuario "${usuario.username}"?`;
  
  if (confirm(mensaje)) {
    toggleActivo(id, activoActual);
  }
}

/**
 * Abre el modal para cambiar contraseña
 */
function abrirModalPassword(id, username) {
  document.getElementById('password-user-id').value = id;
  document.getElementById('password-username').textContent = username;
  
  // Resetear formulario
  document.getElementById('form-password').reset();
  
  // Ocultar mensajes de error
  document.getElementById('modal-password-error').classList.add('hidden');
  
  // Mostrar modal
  document.getElementById('modal-password').style.display = 'flex';
}

/**
 * Maneja el envío del formulario de cambio de contraseña
 */
async function handleSubmitPassword(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  
  const id = parseInt(document.getElementById('password-user-id').value);
  const password = formData.get('password');
  const confirmar = formData.get('confirmar');
  
  // Validar que las contraseñas coincidan
  if (password !== confirmar) {
    showModalPasswordError('Las contraseñas no coinciden');
    return;
  }
  
  // Validar longitud
  if (password.length < 6) {
    showModalPasswordError('La contraseña debe tener al menos 6 caracteres');
    return;
  }
  
  // Cambiar contraseña
  await cambiarPassword(id, password);
}

/**
 * Cierra un modal
 */
function cerrarModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// =============================================
// UTILIDADES
// =============================================

/**
 * Muestra un mensaje de error en el modal de usuario
 */
function showModalError(message) {
  const container = document.getElementById('modal-error');
  container.innerHTML = `
    <div class="alert alert-error">
      ${message}
    </div>
  `;
  container.classList.remove('hidden');
  
  setTimeout(() => {
    container.classList.add('hidden');
  }, 5000);
}

/**
 * Muestra un mensaje de error en el modal de password
 */
function showModalPasswordError(message) {
  const container = document.getElementById('modal-password-error');
  container.innerHTML = `
    <div class="alert alert-error">
      ${message}
    </div>
  `;
  container.classList.remove('hidden');
  
  setTimeout(() => {
    container.classList.add('hidden');
  }, 5000);
}

/**
 * Obtiene la clase de badge según el rol
 */
function getRolBadgeClass(rol) {
  const classes = {
    'ADMIN': 'error',
    'ALCALDE': 'warning',
    'JEFE_DEPTO': 'info',
    'RECEPCION': 'success'
  };
  return classes[rol] || 'default';
}

/**
 * Formatea el nombre del rol
 */
function formatRol(rol) {
  const nombres = {
    'ADMIN': 'Administrador',
    'ALCALDE': 'Alcalde',
    'JEFE_DEPTO': 'Jefe Depto.',
    'RECEPCION': 'Recepción'
  };
  return nombres[rol] || rol;
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
