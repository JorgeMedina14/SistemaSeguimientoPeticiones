const { getPool } = require('./src/db/pool');

(async () => {
  try {
    const pool = await getPool();

    const r1 = await pool.request().query(`
      SELECT 
        c.name AS ColumnName,
        t.name AS DataType,
        ic.seed_value,
        ic.increment_value,
        ic.last_value
      FROM sys.identity_columns ic
      JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      JOIN sys.types t ON c.user_type_id = t.user_type_id
      WHERE OBJECT_NAME(ic.object_id) = 'Peticion'
    `);
    console.log('IDENTITY info:', JSON.stringify(r1.recordset, null, 2));

    const r2 = await pool.request().query(`
      SELECT IdPeticion, Codigo, FechaCreacion
      FROM dbo.Peticion
      ORDER BY IdPeticion
    `);
    console.log('Peticiones:', JSON.stringify(r2.recordset, null, 2));

    const r3 = await pool.request().query(`
      SELECT IDENT_CURRENT('Peticion') AS CurrentIdentity, MAX(IdPeticion) AS MaxId
      FROM dbo.Peticion
    `);
    console.log('Current identity:', JSON.stringify(r3.recordset, null, 2));

    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
