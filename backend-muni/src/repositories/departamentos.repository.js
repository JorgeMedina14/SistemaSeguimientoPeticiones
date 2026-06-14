const { getPool } = require('../db/pool');

const findAllDepartamentos = async () => {
  const pool = await getPool();
  const result = await pool.request()
    .query(`
      SELECT IdDepartamento, Nombre
      FROM dbo.Departamento
      WHERE Activo = 1
      ORDER BY Nombre
    `);

  return result.recordset.map(r => ({
    idDepartamento: r.IdDepartamento,
    nombre: r.Nombre
  }));
};

module.exports = {
  findAllDepartamentos
};
