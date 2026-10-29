const { getPool } = require('../db/pool');
const dbConfig = require('../config/db');

const pingDatabase = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT 1 AS Resultado');

    res.status(200).json({
      success: true,
      message: 'Conexión exitosa a SQL Server',
      server: dbConfig.server,
      database: dbConfig.database,
      result: result.recordset[0]
    });
  } catch (error) {
    console.error('Error en pingDatabase:', error);
    res.status(500).json({
      success: false,
      message: 'Error al conectar con SQL Server',
      error: process.env.NODE_ENV === 'development'
        ? (error.message || String(error))
        : 'No se pudo establecer la conexión'
    });
  }
};

module.exports = {
  pingDatabase
};
