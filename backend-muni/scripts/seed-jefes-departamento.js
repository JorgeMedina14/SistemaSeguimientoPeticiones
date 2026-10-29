require('dotenv').config();

const bcrypt = require('bcrypt');
const usuariosRepository = require('../src/repositories/usuarios.repository');
const { closePool } = require('../src/db/pool');

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'jefe123';

// No se crean jefes para DESPACHO ALCALDÍA ni ATENCIÓN CIUDADANA:
// esos roles los cubren alcalde y recepcion.
const JEFES = [
  {
    username: 'jefe_obras',
    idDepartamento: 3,
    nombreCompleto: 'Jefe - OBRAS MUNICIPALES'
  },
  {
    username: 'jefe_jalapagua',
    idDepartamento: 4,
    nombreCompleto: 'Jefe - JALAPAGUA'
  },
  {
    username: 'jefe_electrica',
    idDepartamento: 5,
    nombreCompleto: 'Jefe - EMPRESA ELECTRICA'
  }
];

async function seedJefes() {
  console.log('='.repeat(50));
  console.log('Seed JEFE_DEPTO por departamento');
  console.log('='.repeat(50));

  let creados = 0;
  let omitidos = 0;

  for (const jefe of JEFES) {
    const existente = await usuariosRepository.findUsuarioByUsername(jefe.username);

    if (existente) {
      console.log(`[OMITIDO] ${jefe.username} ya existe (IdUsuario=${existente.IdUsuario || existente.idUsuario})`);
      omitidos += 1;
      continue;
    }

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
    const nuevo = await usuariosRepository.createUsuario({
      username: jefe.username,
      passwordHash,
      nombreCompleto: jefe.nombreCompleto,
      rol: 'JEFE_DEPTO',
      idDepartamento: jefe.idDepartamento
    });

    console.log(
      `[CREADO] ${jefe.username} → IdUsuario=${nuevo.IdUsuario}, ` +
      `IdDepartamento=${jefe.idDepartamento}, password=${DEFAULT_PASSWORD}`
    );
    creados += 1;
  }

  console.log('-'.repeat(50));
  console.log(`Resumen: ${creados} creados, ${omitidos} omitidos`);
  console.log('='.repeat(50));
}

seedJefes()
  .catch((error) => {
    console.error('Error en seed de jefes:', error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await closePool();
    } catch (_) {
      // ignore close errors
    }
  });
