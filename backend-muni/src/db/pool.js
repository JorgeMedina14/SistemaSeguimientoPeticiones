const sql = require('./sql');
const dbConfig = require('../config/db');

let pool = null;
let connecting = null;

const isUsable = (candidate) =>
  Boolean(candidate && candidate.connected && !candidate.connecting && !candidate.destroyed);

const resetPool = async () => {
  const previous = pool;
  pool = null;
  connecting = null;

  if (!previous) return;

  try {
    await previous.close();
  } catch {
    // El pool ya podía estar cerrado.
  }
};

const createPool = async () => {
  const next = dbConfig.useSqlAuth
    ? new sql.ConnectionPool(dbConfig.tedious)
    : new sql.ConnectionPool({
        connectionString: dbConfig.connectionString,
        options: dbConfig.options,
        pool: dbConfig.pool
      });

  next.on('error', (err) => {
    console.error('Error en pool de SQL Server:', err.message || err);
    if (pool === next) {
      pool = null;
      connecting = null;
    }
  });

  await next.connect();
  console.log('Conexión a SQL Server establecida correctamente');
  console.log(`Server: ${dbConfig.server} | Database: ${dbConfig.database}`);
  return next;
};

const getPool = async () => {
  if (isUsable(pool)) {
    return pool;
  }

  if (connecting) {
    return connecting;
  }

  connecting = (async () => {
    try {
      if (pool && !isUsable(pool)) {
        await resetPool();
      }

      if (isUsable(pool)) {
        return pool;
      }

      pool = await createPool();
      return pool;
    } catch (error) {
      pool = null;
      console.error('Error al conectar a SQL Server:');
      console.error('Message:', error.message);
      console.error('Code:', error.code);
      if (error.originalError) {
        console.error('Original Error:', error.originalError);
      }
      throw error;
    } finally {
      connecting = null;
    }
  })();

  return connecting;
};

const closePool = async () => {
  await resetPool();
  console.log('Pool de SQL Server cerrado');
};

const isConnectionError = (error) => {
  const code = String(error?.code || '');
  const message = String(error?.message || '');
  return (
    code === 'ECONNCLOSED' ||
    code === 'ETIMEOUT' ||
    code === 'ESOCKET' ||
    /Connection is closed/i.test(message) ||
    /connection.*closed/i.test(message)
  );
};

/** Ejecuta una operación con el pool; si la conexión murió, reconecta una vez y reintenta. */
const withPool = async (operation) => {
  try {
    const active = await getPool();
    return await operation(active);
  } catch (error) {
    if (!isConnectionError(error)) {
      throw error;
    }

    console.warn('Conexión SQL inválida. Reconectando y reintentando...');
    await resetPool();
    const active = await getPool();
    return operation(active);
  }
};

module.exports = {
  getPool,
  closePool,
  withPool
};
