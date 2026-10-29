/**
 * Prueba punta a punta por rol (API).
 * Uso: node scripts/e2e-roles.js
 */
require('dotenv').config();

const BASE = process.env.E2E_BASE_URL || 'http://localhost:5000';

const USERS = [
  { username: 'admin', password: 'admin123', rol: 'ADMIN' },
  { username: 'alcalde', password: 'alcalde123', rol: 'ALCALDE' },
  { username: 'recepcion', password: 'recepcion123', rol: 'RECEPCION' },
  { username: 'jefe_obras', password: 'jefe123', rol: 'JEFE_DEPTO', depto: 3 },
  { username: 'jefe_jalapagua', password: 'jefe123', rol: 'JEFE_DEPTO', depto: 4 },
  { username: 'jefe_electrica', password: 'jefe123', rol: 'JEFE_DEPTO', depto: 5 }
];

async function request(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function login(user) {
  const { status, data } = await request('POST', '/auth/login', {
    body: { username: user.username, password: user.password }
  });
  if (status !== 200 || !data?.data?.token) {
    throw new Error(`Login falló (${status}): ${data?.message || JSON.stringify(data)}`);
  }
  return data.data;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function runForUser(user) {
  const results = [];
  const log = (ok, name, detail = '') => {
    results.push({ ok, name, detail });
    console.log(`${ok ? '  OK  ' : ' FAIL '} ${name}${detail ? ` — ${detail}` : ''}`);
  };

  console.log(`\n=== ${user.username} (${user.rol}) ===`);
  const session = await login(user);
  const token = session.token;
  assert(session.user?.rol === user.rol, `Rol esperado ${user.rol}, got ${session.user?.rol}`);
  log(true, 'login');

  const me = await request('GET', '/auth/me', { token });
  log(me.status === 200, 'GET /auth/me', `status=${me.status}`);

  const peticiones = await request('GET', '/peticiones?page=1&limit=10', { token });
  log(peticiones.status === 200, 'GET /peticiones', `status=${peticiones.status}`);

  if (user.rol === 'JEFE_DEPTO') {
    const items = peticiones.data?.data || [];
    const ajenas = items.filter((p) => {
      const id = p.idDepartamento ?? p.departamento?.idDepartamento;
      return id && Number(id) !== Number(user.depto);
    });
    log(ajenas.length === 0, 'filtro depto JEFE', `visibles=${items.length}, ajenas=${ajenas.length}`);
  }

  const dashboard = await request('GET', '/reportes/dashboard', { token });
  const reportesOk = user.rol === 'ADMIN' || user.rol === 'ALCALDE';
  log(
    reportesOk ? dashboard.status === 200 : dashboard.status === 403,
    'GET /reportes/dashboard',
    `status=${dashboard.status} (esperado ${reportesOk ? 200 : 403})`
  );

  const resumen = await request('GET', '/reportes/resumen', { token });
  log(
    reportesOk ? resumen.status === 200 : resumen.status === 403,
    'GET /reportes/resumen',
    `status=${resumen.status}`
  );

  const usuarios = await request('GET', '/usuarios', { token });
  log(
    user.rol === 'ADMIN' ? usuarios.status === 200 : usuarios.status === 403,
    'GET /usuarios',
    `status=${usuarios.status} (esperado ${user.rol === 'ADMIN' ? 200 : 403})`
  );

  const deptos = await request('GET', '/departamentos', { token });
  const deptoAllowed = ['ADMIN', 'ALCALDE', 'RECEPCION'].includes(user.rol);
  log(
    deptoAllowed ? deptos.status === 200 : deptos.status === 403,
    'GET /departamentos',
    `status=${deptos.status}`
  );

  if (user.rol === 'RECEPCION' || user.rol === 'ALCALDE') {
    const dpi = `2${String(Date.now()).slice(-12)}`;
    const create = await request('POST', '/peticiones', {
      token,
      body: {
        ciudadano: {
          dpi,
          nombres: 'Prueba',
          apellidos: `E2E ${user.username}`,
          telefono: '55550000',
          correo: null,
          direccion: null
        },
        peticion: {
          titulo: `E2E ${user.username} ${Date.now()}`,
          descripcion: 'Peticion creada por prueba automatica de roles',
          prioridad: 'MEDIA'
        },
        idDepartamento: 3
      }
    });
    log(create.status === 201 || create.status === 200, 'POST /peticiones', `status=${create.status}`);

    const id = create.data?.data?.idPeticion || create.data?.data?.IdPeticion;
    if (id && user.rol === 'ALCALDE') {
      const cambio = await request('PUT', `/peticiones/${id}/estado`, {
        token,
        body: { estadoNuevo: 'EN_REVISION', comentario: 'E2E cambio estado' }
      });
      log(cambio.status === 200, 'PUT /peticiones/:id/estado', `status=${cambio.status}`);
    }
  } else if (user.rol === 'JEFE_DEPTO') {
    const create = await request('POST', '/peticiones', {
      token,
      body: {
        ciudadano: {
          dpi: `3${String(Date.now()).slice(-12)}`,
          nombres: 'No',
          apellidos: 'Permitido',
          telefono: null,
          correo: null,
          direccion: null
        },
        peticion: {
          titulo: 'No debe crearse',
          descripcion: 'JEFE no crea peticiones',
          prioridad: 'BAJA'
        },
        idDepartamento: user.depto
      }
    });
    log(create.status === 403, 'POST /peticiones denegado', `status=${create.status}`);
  }

  return results;
}

(async () => {
  console.log('E2E roles —', BASE);
  const health = await request('GET', '/health');
  if (health.status !== 200) {
    console.error('Backend no responde en', BASE);
    process.exit(1);
  }

  let failed = 0;
  for (const user of USERS) {
    try {
      const results = await runForUser(user);
      failed += results.filter((r) => !r.ok).length;
    } catch (error) {
      failed += 1;
      console.log(` FAIL  suite ${user.username}: ${error.message}`);
    }
  }

  console.log('\n==============================');
  console.log(failed === 0 ? 'RESULTADO: TODAS LAS PRUEBAS OK' : `RESULTADO: ${failed} fallos`);
  console.log('==============================');
  process.exit(failed === 0 ? 0 : 1);
})();
