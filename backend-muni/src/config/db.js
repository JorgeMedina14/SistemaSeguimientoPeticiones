const dbConfig = {
  server: process.env.DB_SERVER || 'JORGE\\SQLDEVELOPER',
  database: process.env.DB_DATABASE || 'MuniPeticionesJalapa',
  user: process.env.DB_USER || 'apiuser',
  password: process.env.DB_PASSWORD || 'MuniJalapa2026!',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    instanceName: 'SQLDEVELOPER'
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

module.exports = dbConfig;
