const sql = require('mssql');
const dbConfig = require('../config/db');

let pool = null;

const getPool = async () => {
  if (pool && pool.connected) {
    return pool;
  }

  try {
    pool = await sql.connect(dbConfig);
    console.log('Conexión a SQL Server establecida correctamente');
    
    pool.on('error', err => {
      console.error('Error en pool de SQL Server:', err);
    });

    return pool;
  } catch (error) {
    console.error('Error al conectar a SQL Server:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Original Error:', error.originalError);
    throw error;
  }
};

const closePool = async () => {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('Pool de SQL Server cerrado');
    }
  } catch (error) {
    console.error('Error al cerrar pool:', error.message);
    throw error;
  }
};

module.exports = {
  getPool,
  closePool,
  sql
};
