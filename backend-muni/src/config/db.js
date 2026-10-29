const normalizeInstance = (value) =>
  String(value || '').replace(/\\\\/g, '\\');

const useSqlAuth = Boolean(process.env.DB_USER && process.env.DB_PASSWORD);
const server = normalizeInstance(process.env.DB_SERVER || 'localhost\\SQLEXPRESS');
const database = process.env.DB_DATABASE || 'MuniPeticionesJalapa';
const odbcDriver = process.env.DB_ODBC_DRIVER || 'ODBC Driver 17 for SQL Server';
const port = Number(process.env.DB_PORT || 1433);
const encrypt = process.env.DB_ENCRYPT === 'true';
const trustServerCertificate = process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false';

const dbConfig = {
  useSqlAuth,
  server,
  port,
  database,
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  encrypt,
  trustServerCertificate,
  driver: useSqlAuth ? 'tedious' : 'msnodesqlv8',
  options: {
    trustedConnection: !useSqlAuth && process.env.DB_TRUSTED_CONNECTION !== 'false',
    trustServerCertificate,
    enableArithAbort: true,
    encrypt,
    // datetime2 sin zona: SYSDATETIME() es hora local del servidor (Guatemala)
    useUTC: false
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

if (useSqlAuth) {
  dbConfig.tedious = {
    user: dbConfig.user,
    password: dbConfig.password,
    server,
    port,
    database,
    options: {
      encrypt,
      trustServerCertificate,
      enableArithAbort: true,
      useUTC: false
    },
    pool: dbConfig.pool
  };
}

dbConfig.connectionString =
  normalizeInstance(
    process.env.DB_CONNECTION_STRING ||
      `Driver={${odbcDriver}};Server=${server};Database=${database};Trusted_Connection=Yes;TrustServerCertificate=Yes;`
  );

module.exports = dbConfig;
