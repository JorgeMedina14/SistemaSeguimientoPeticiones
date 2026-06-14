const { getPool } = require('../db/pool');

const findUserByUsername = async (username) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('username', username)
    .query(`
      SELECT 
        IdUsuario,
        IdDepartamento,
        Username,
        PasswordHash,
        NombreCompleto,
        Rol,
        Activo
      FROM dbo.Usuario
      WHERE Username = @username
    `);
  
  return result.recordset[0];
};

const findUserById = async (idUsuario) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('idUsuario', idUsuario)
    .query(`
      SELECT 
        IdUsuario,
        IdDepartamento,
        Username,
        NombreCompleto,
        Rol,
        Activo
      FROM dbo.Usuario
      WHERE IdUsuario = @idUsuario
    `);
  
  return result.recordset[0];
};

module.exports = {
  findUserByUsername,
  findUserById
};
