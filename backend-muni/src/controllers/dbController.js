const { getPool } = require('../db/pool');

const pingDatabase = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT 1 AS Resultado');
    
    res.status(200).json({
      success: true,
      message: 'Conexión exitosa a SQL Server',
      server: 'JORGE\\SQLDEVELOPER',
      database: 'MuniPeticionesJalapa',
      result: result.recordset[0]
    });
  } catch (error) {
    console.error('Error en pingDatabase:', error);
    res.status(500).json({
      success: false,
      message: 'Error al conectar con SQL Server',
      error: error.message || String(error),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  pingDatabase
};
