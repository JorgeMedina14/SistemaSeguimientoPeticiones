const { getPool } = require('../db/pool');
const sql = require('../db/sql');

const mapUsuario = (r) => ({
  idUsuario: r.IdUsuario,
  idDepartamento: r.IdDepartamento,
  username: r.Username,
  nombreCompleto: r.NombreCompleto,
  rol: r.Rol,
  activo: r.Activo,
  fechaCreacion: r.FechaCreacion,
  fechaUltimoAcceso: r.FechaUltimoAcceso,
  departamento: r.NombreDepartamento
});

const bindFiltrosUsuario = (request, { rol, activo, departamento }) => {
  if (rol) request.input('rol', sql.VarChar(20), rol);
  if (activo !== undefined) request.input('activo', sql.Bit, activo === 'true' || activo === true ? 1 : 0);
  if (departamento) request.input('departamento', sql.Int, departamento);
  return request;
};

const createUsuario = async (userData) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('idDepartamento', sql.Int, userData.idDepartamento || null)
    .input('username', sql.VarChar(50), userData.username)
    .input('passwordHash', sql.NVarChar(255), userData.passwordHash)
    .input('nombreCompleto', sql.NVarChar(150), userData.nombreCompleto)
    .input('rol', sql.VarChar(20), userData.rol)
    .query(`
      INSERT INTO dbo.Usuario (IdDepartamento, Username, PasswordHash, NombreCompleto, Rol, Activo)
      OUTPUT 
        INSERTED.IdUsuario,
        INSERTED.IdDepartamento,
        INSERTED.Username,
        INSERTED.NombreCompleto,
        INSERTED.Rol,
        INSERTED.Activo,
        INSERTED.FechaCreacion
      VALUES (@idDepartamento, @username, @passwordHash, @nombreCompleto, @rol, 1)
    `);
  
  return result.recordset[0];
};

const findAllUsuarios = async (filtros) => {
  const pool = await getPool();
  
  const { page, limit, rol, activo, departamento } = filtros;
  
  const whereConditions = [];
  if (rol) whereConditions.push('u.Rol = @rol');
  if (activo !== undefined) whereConditions.push('u.Activo = @activo');
  if (departamento) whereConditions.push('u.IdDepartamento = @departamento');

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  const request = bindFiltrosUsuario(pool.request(), filtros);
  const countRequest = bindFiltrosUsuario(pool.request(), filtros);
  
  const countResult = await countRequest.query(`
    SELECT COUNT(*) AS Total
    FROM dbo.Usuario u
    ${whereClause}
  `);
  
  const total = countResult.recordset[0].Total;
  
  const pageNum = page || 1;
  const limitNum = limit || 10;
  const offset = (pageNum - 1) * limitNum;
  
  const result = await request.query(`
    SELECT 
      u.IdUsuario,
      u.IdDepartamento,
      u.Username,
      u.NombreCompleto,
      u.Rol,
      u.Activo,
      u.FechaCreacion,
      u.FechaUltimoAcceso,
      d.Nombre AS NombreDepartamento
    FROM dbo.Usuario u
    LEFT JOIN dbo.Departamento d ON u.IdDepartamento = d.IdDepartamento
    ${whereClause}
    ORDER BY u.FechaCreacion DESC
    OFFSET ${offset} ROWS
    FETCH NEXT ${limitNum} ROWS ONLY
  `);
  
  return {
    data: result.recordset.map(mapUsuario),
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum)
  };
};

const findUsuarioById = async (idUsuario) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('idUsuario', sql.Int, idUsuario)
    .query(`
      SELECT 
        u.IdUsuario,
        u.IdDepartamento,
        u.Username,
        u.NombreCompleto,
        u.Rol,
        u.Activo,
        u.FechaCreacion,
        u.FechaUltimoAcceso,
        d.Nombre AS NombreDepartamento
      FROM dbo.Usuario u
      LEFT JOIN dbo.Departamento d ON u.IdDepartamento = d.IdDepartamento
      WHERE u.IdUsuario = @idUsuario
    `);
  
  if (result.recordset.length === 0) {
    return null;
  }

  return mapUsuario(result.recordset[0]);
};

const updateUsuario = async (idUsuario, userData) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('idUsuario', sql.Int, idUsuario)
    .input('idDepartamento', sql.Int, userData.idDepartamento || null)
    .input('nombreCompleto', sql.NVarChar(150), userData.nombreCompleto)
    .input('rol', sql.VarChar(20), userData.rol)
    .query(`
      UPDATE dbo.Usuario
      SET 
        IdDepartamento = @idDepartamento,
        NombreCompleto = @nombreCompleto,
        Rol = @rol
      OUTPUT 
        INSERTED.IdUsuario,
        INSERTED.IdDepartamento,
        INSERTED.Username,
        INSERTED.NombreCompleto,
        INSERTED.Rol,
        INSERTED.Activo
      WHERE IdUsuario = @idUsuario
    `);
  
  return result.recordset[0];
};

const updateUsuarioActivo = async (idUsuario, activo) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('idUsuario', sql.Int, idUsuario)
    .input('activo', sql.Bit, activo ? 1 : 0)
    .query(`
      UPDATE dbo.Usuario
      SET Activo = @activo
      OUTPUT INSERTED.IdUsuario, INSERTED.Activo
      WHERE IdUsuario = @idUsuario
    `);
  
  return result.recordset[0];
};

const updateUsuarioPassword = async (idUsuario, passwordHash) => {
  const pool = await getPool();
  await pool.request()
    .input('idUsuario', sql.Int, idUsuario)
    .input('passwordHash', sql.NVarChar(255), passwordHash)
    .query(`
      UPDATE dbo.Usuario
      SET PasswordHash = @passwordHash
      WHERE IdUsuario = @idUsuario
    `);
};

const findUsuarioByUsername = async (username) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('username', sql.VarChar(50), username)
    .query('SELECT IdUsuario FROM dbo.Usuario WHERE Username = @username');
  
  return result.recordset[0];
};

const countAlcaldesActivos = async () => {
  const pool = await getPool();
  const result = await pool.request()
    .query("SELECT COUNT(*) AS Total FROM dbo.Usuario WHERE Rol = 'ALCALDE' AND Activo = 1");
  
  return result.recordset[0].Total;
};

const deleteUsuario = async (idUsuario) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    await transaction.request()
      .input('idUsuario', sql.Int, idUsuario)
      .query('UPDATE dbo.Seguimiento SET IdUsuario = NULL WHERE IdUsuario = @idUsuario');

    await transaction.request()
      .input('idUsuario', sql.Int, idUsuario)
      .query('UPDATE dbo.Peticion SET CreadoPorUsuarioId = NULL WHERE CreadoPorUsuarioId = @idUsuario');

    const result = await transaction.request()
      .input('idUsuario', sql.Int, idUsuario)
      .query('DELETE FROM dbo.Usuario WHERE IdUsuario = @idUsuario');

    await transaction.commit();
    return result.rowsAffected[0] > 0;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  createUsuario,
  findAllUsuarios,
  findUsuarioById,
  updateUsuario,
  updateUsuarioActivo,
  updateUsuarioPassword,
  findUsuarioByUsername,
  countAlcaldesActivos,
  deleteUsuario
};
