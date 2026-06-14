// nueva-peticion.js - Registro de peticiones (RECEPCION y ALCALDE)

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const user = await requireRole(['RECEPCION', 'ALCALDE']);
    if (!user) return;

    const mainContent = `
      <div class="page-header">
        <h2>Nueva Peticion</h2>
        <p class="text-muted">Registro de peticion ciudadana</p>
      </div>
      <div id="message-container"></div>
      <div class="card">
        <div class="card-body">
          <form id="form-nueva-peticion">
            <h3 class="form-section-title">Datos del ciudadano</h3>
            <div class="form-row">
              <div class="form-group">
                <label for="dpi">DPI *</label>
                <input type="text" id="dpi" name="dpi" class="form-control" maxlength="13" required placeholder="13 digitos">
              </div>
              <div class="form-group">
                <label for="nombres">Nombres *</label>
                <input type="text" id="nombres" name="nombres" class="form-control" required>
              </div>
              <div class="form-group">
                <label for="apellidos">Apellidos *</label>
                <input type="text" id="apellidos" name="apellidos" class="form-control" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="telefono">Telefono</label>
                <input type="text" id="telefono" name="telefono" class="form-control">
              </div>
              <div class="form-group">
                <label for="correo">Correo</label>
                <input type="email" id="correo" name="correo" class="form-control">
              </div>
            </div>
            <div class="form-group">
              <label for="direccion">Direccion</label>
              <input type="text" id="direccion" name="direccion" class="form-control">
            </div>
            <h3 class="form-section-title">Datos de la peticion</h3>
            <div class="form-group">
              <label for="titulo">Titulo *</label>
              <input type="text" id="titulo" name="titulo" class="form-control" required maxlength="200">
            </div>
            <div class="form-group">
              <label for="descripcion">Descripcion *</label>
              <textarea id="descripcion" name="descripcion" class="form-control" rows="4" required></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="idDepartamento">Departamento *</label>
                <select id="idDepartamento" name="idDepartamento" class="form-control" required>
                  <option value="">Seleccione un departamento</option>
                </select>
              </div>
              <div class="form-group">
                <label for="prioridad">Prioridad</label>
                <select id="prioridad" name="prioridad" class="form-control">
                  <option value="BAJA">Baja</option>
                  <option value="MEDIA" selected>Media</option>
                  <option value="ALTA">Alta</option>
                </select>
              </div>
            </div>
            <div class="form-actions">
              <a href="peticiones.html" class="btn btn-outline">Cancelar</a>
              <button type="submit" class="btn btn-primary" id="btn-guardar">Guardar peticion</button>
            </div>
          </form>
        </div>
      </div>
    `;

    renderLayout(user, mainContent);

    await cargarDepartamentos();
    document.getElementById('form-nueva-peticion').addEventListener('submit', handleSubmit);
  } catch (error) {
    console.error('Error al cargar nueva peticion:', error);
    auth.logout();
  }

  async function cargarDepartamentos() {
    var select = document.getElementById('idDepartamento');
    var departamentos = [];

    try {
      var response = await api.get('/departamentos');
      departamentos = response.data || [];
    } catch (error) {
      departamentos = [
        { idDepartamento: 1, nombre: 'Obras Municipales' },
        { idDepartamento: 2, nombre: 'Empresa Electrica' },
        { idDepartamento: 3, nombre: 'Jalapagua' }
      ];
    }

    departamentos.forEach(function (d) {
      var option = document.createElement('option');
      option.value = d.idDepartamento;
      option.textContent = d.nombre;
      select.appendChild(option);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    var btn = document.getElementById('btn-guardar');
    var container = document.getElementById('message-container');

    var dpi = document.getElementById('dpi').value.trim();
    if (!/^\d{13}$/.test(dpi)) {
      showMessage(container, 'El DPI debe tener exactamente 13 digitos numericos.', 'error');
      return;
    }

    var payload = {
      ciudadano: {
        dpi: dpi,
        nombres: document.getElementById('nombres').value.trim(),
        apellidos: document.getElementById('apellidos').value.trim(),
        telefono: document.getElementById('telefono').value.trim() || null,
        correo: document.getElementById('correo').value.trim() || null,
        direccion: document.getElementById('direccion').value.trim() || null
      },
      peticion: {
        titulo: document.getElementById('titulo').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim(),
        prioridad: document.getElementById('prioridad').value
      },
      idDepartamento: parseInt(document.getElementById('idDepartamento').value, 10)
    };

    try {
      btn.disabled = true;
      btn.textContent = 'Guardando...';

      var response = await api.post('/peticiones', payload);
      var creada = response.data;

      showMessage(container, 'Peticion creada: ' + (creada.codigo || 'OK') + '. Redirigiendo...', 'success');

      setTimeout(function () {
        window.location.href = 'peticion-detalle.html?id=' + creada.idPeticion;
      }, 1500);
    } catch (error) {
      showMessage(container, error.message || 'Error al crear la peticion', 'error');
      btn.disabled = false;
      btn.textContent = 'Guardar peticion';
    }
  }

  function showMessage(container, message, type) {
    if (!container) {
      alert(message);
      return;
    }
    container.innerHTML = '<div class="alert alert-' + type + '">' + message + '</div>';
  }
});
