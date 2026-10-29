const { getPool } = require('../db/pool');
const sql = require('../db/sql');

const findCiudadanoByDPI = async (dpi) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('dpi', sql.VarChar(13), dpi)
    .query('SELECT IdCiudadano FROM dbo.Ciudadano WHERE DPI = @dpi');
  
  return result.recordset[0];
};

const createCiudadano = async (transaction, ciudadanoData) => {
  const result = await transaction.request()
    .input('dpi', sql.VarChar(13), ciudadanoData.dpi)
    .input('nombres', sql.NVarChar(120), ciudadanoData.nombres)
    .input('apellidos', sql.NVarChar(120), ciudadanoData.apellidos)
    .input('telefono', sql.VarChar(20), ciudadanoData.telefono || null)
    .input('correo', sql.NVarChar(150), ciudadanoData.correo || null)
    .input('direccion', sql.NVarChar(250), ciudadanoData.direccion || null)
    .query(`
      INSERT INTO dbo.Ciudadano (DPI, Nombres, Apellidos, Telefono, Correo, Direccion)
      OUTPUT INSERTED.IdCiudadano
      VALUES (@dpi, @nombres, @apellidos, @telefono, @correo, @direccion)
    `);
  
  return result.recordset[0].IdCiudadano;
};

const generateCodigoPeticion = async (transaction) => {
  const anioActual = new Date().getFullYear();
  
  const resultSecuencia = await transaction.request()
    .input('anio', sql.Int, anioActual)
    .query(`
      IF NOT EXISTS (SELECT 1 FROM dbo.SecuenciaCodigo WHERE Anio = @anio)
      BEGIN
        INSERT INTO dbo.SecuenciaCodigo (Anio, Prefijo, CorrelativoActual)
        VALUES (@anio, 'PET', 0)
      END
      
      UPDATE dbo.SecuenciaCodigo WITH (UPDLOCK, HOLDLOCK)
      SET CorrelativoActual = CorrelativoActual + 1,
          FechaActualizacion = SYSDATETIME()
      OUTPUT INSERTED.CorrelativoActual
      WHERE Anio = @anio
    `);
  
  return `JAL-${anioActual}-${resultSecuencia.recordset[0].CorrelativoActual.toString().padStart(6, '0')}`;
};

const createPeticion = async (transaction, peticionData) => {
  const result = await transaction.request()
    .input('codigo', sql.VarChar(25), peticionData.codigo)
    .input('idCiudadano', sql.Int, peticionData.idCiudadano)
    .input('idDepartamento', sql.Int, peticionData.idDepartamento)
    .input('creadoPorUsuarioId', sql.Int, peticionData.creadoPorUsuarioId)
    .input('titulo', sql.NVarChar(200), peticionData.titulo)
    .input('descripcion', sql.NVarChar(sql.MAX), peticionData.descripcion)
    .input('prioridad', sql.VarChar(10), peticionData.prioridad)
    .query(`
      INSERT INTO dbo.Peticion 
        (Codigo, IdCiudadano, IdDepartamento, CreadoPorUsuarioId, Titulo, Descripcion, Estado, Prioridad)
      OUTPUT 
        INSERTED.IdPeticion,
        INSERTED.Codigo,
        INSERTED.Estado,
        INSERTED.Prioridad,
        INSERTED.FechaCreacion
      VALUES 
        (@codigo, @idCiudadano, @idDepartamento, @creadoPorUsuarioId, @titulo, @descripcion, 'RECIBIDA', @prioridad)
    `);
  
  return result.recordset[0];
};

const createSeguimiento = async (transaction, seguimientoData) => {
  await transaction.request()
    .input('idPeticion', sql.BigInt, seguimientoData.idPeticion)
    .input('idUsuario', sql.Int, seguimientoData.idUsuario)
    .input('estadoAnterior', sql.VarChar(20), seguimientoData.estadoAnterior || null)
    .input('estadoNuevo', sql.VarChar(20), seguimientoData.estadoNuevo)
    .input('comentario', sql.NVarChar(500), seguimientoData.comentario || null)
    .query(`
      INSERT INTO dbo.Seguimiento (IdPeticion, IdUsuario, EstadoAnterior, EstadoNuevo, Comentario)
      VALUES (@idPeticion, @idUsuario, @estadoAnterior, @estadoNuevo, @comentario)
    `);
};

const findPeticionById = async (idPeticion) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('idPeticion', sql.BigInt, idPeticion)
    .query(`
      SELECT 
        IdPeticion,
        Codigo,
        IdCiudadano,
        IdDepartamento,
        CreadoPorUsuarioId,
        Titulo,
        Descripcion,
        Estado,
        Prioridad,
        FechaCreacion,
        FechaLimite,
        FechaCierre
      FROM dbo.Peticion
      WHERE IdPeticion = @idPeticion
    `);
  
  return result.recordset[0];
};

const updateEstadoPeticion = async (transaction, idPeticion, estadoNuevo) => {
  const estadosFinales = ['RESUELTA', 'RECHAZADA', 'CERRADA'];
  const esEstadoFinal = estadosFinales.includes(estadoNuevo);

  await transaction.request()
    .input('idPeticion', sql.BigInt, idPeticion)
    .input('estadoNuevo', sql.VarChar(20), estadoNuevo)
    .input('esEstadoFinal', sql.Bit, esEstadoFinal ? 1 : 0)
    .query(`
      UPDATE dbo.Peticion
      SET Estado = @estadoNuevo,
          FechaCierre = CASE
            WHEN @esEstadoFinal = 1 THEN SYSDATETIME()
            ELSE NULL
          END
      WHERE IdPeticion = @idPeticion
    `);
};

const deletePeticion = async (idPeticion) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('idPeticion', sql.BigInt, idPeticion)
    .query(`
      DELETE FROM dbo.Peticion
      WHERE IdPeticion = @idPeticion
    `);

  return result.rowsAffected[0] > 0;
};

const bindFiltrosPeticion = (request, filtros, idDepartamentoUsuario) => {
  const { estado, prioridad, departamento, fechaInicio, fechaFin, q } = filtros;
  if (idDepartamentoUsuario) request.input('idDepartamentoUsuario', sql.Int, idDepartamentoUsuario);
  if (estado) request.input('estado', sql.VarChar(20), estado);
  if (prioridad) request.input('prioridad', sql.VarChar(10), prioridad);
  if (departamento) request.input('departamento', sql.Int, departamento);
  if (fechaInicio && fechaFin) {
    request.input('fechaInicio', sql.Date, fechaInicio);
    request.input('fechaFin', sql.Date, fechaFin);
  }
  if (q) request.input('q', sql.NVarChar(200), `%${q}%`);
  return request;
};

const listPeticiones = async (filtros, idDepartamentoUsuario) => {
  const pool = await getPool();

  const { page, limit, estado, prioridad, departamento, fechaInicio, fechaFin, q } = filtros;

  const whereConditions = [];
  if (idDepartamentoUsuario) whereConditions.push('p.IdDepartamento = @idDepartamentoUsuario');
  if (estado) whereConditions.push('p.Estado = @estado');
  if (prioridad) whereConditions.push('p.Prioridad = @prioridad');
  if (departamento) whereConditions.push('p.IdDepartamento = @departamento');
  if (fechaInicio && fechaFin) whereConditions.push('p.FechaCreacion BETWEEN @fechaInicio AND @fechaFin');
  if (q) whereConditions.push('(p.Codigo LIKE @q OR p.Titulo LIKE @q OR c.DPI LIKE @q)');

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  const request = bindFiltrosPeticion(pool.request(), filtros, idDepartamentoUsuario);
  const countRequest = bindFiltrosPeticion(pool.request(), filtros, idDepartamentoUsuario);
  
  const countResult = await countRequest.query(`
    SELECT COUNT(*) AS Total
    FROM dbo.Peticion p
    INNER JOIN dbo.Ciudadano c ON p.IdCiudadano = c.IdCiudadano
    ${whereClause}
  `);
  
  const total = countResult.recordset[0].Total;
  
  const pageNum = page || 1;
  const limitNum = limit || 10;
  const offset = (pageNum - 1) * limitNum;
  
  const result = await request.query(`
    SELECT 
      p.IdPeticion,
      p.Codigo,
      p.Titulo,
      p.Descripcion,
      p.Estado,
      p.Prioridad,
      p.FechaCreacion,
      p.FechaLimite,
      p.FechaCierre,
      d.Nombre AS Departamento,
      CONCAT(c.Nombres, ' ', c.Apellidos) AS Ciudadano,
      c.DPI,
      u.NombreCompleto AS CreadoPor
    FROM dbo.Peticion p
    INNER JOIN dbo.Ciudadano c ON p.IdCiudadano = c.IdCiudadano
    INNER JOIN dbo.Departamento d ON p.IdDepartamento = d.IdDepartamento
    LEFT JOIN dbo.Usuario u ON p.CreadoPorUsuarioId = u.IdUsuario
    ${whereClause}
    ORDER BY p.FechaCreacion DESC
    OFFSET ${offset} ROWS
    FETCH NEXT ${limitNum} ROWS ONLY
  `);
  
  return {
    data: result.recordset.map(r => ({
      idPeticion: r.IdPeticion,
      codigo: r.Codigo,
      titulo: r.Titulo,
      descripcion: r.Descripcion,
      estado: r.Estado,
      prioridad: r.Prioridad,
      fechaCreacion: r.FechaCreacion,
      fechaLimite: r.FechaLimite,
      fechaCierre: r.FechaCierre,
      departamento: r.Departamento,
      ciudadano: r.Ciudadano,
      dpi: r.DPI,
      creadoPor: r.CreadoPor
    })),
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum)
  };
};

const getPeticionDetalle = async (idPeticion) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('idPeticion', sql.BigInt, idPeticion)
    .query(`
      SELECT 
        p.IdPeticion,
        p.Codigo,
        p.Titulo,
        p.Descripcion,
        p.Estado,
        p.Prioridad,
        p.FechaCreacion,
        p.FechaLimite,
        p.FechaCierre,
        c.IdCiudadano,
        c.DPI,
        c.Nombres,
        c.Apellidos,
        c.Telefono,
        c.Correo,
        c.Direccion,
        d.IdDepartamento,
        d.Nombre AS NombreDepartamento,
        u.NombreCompleto AS CreadoPor
      FROM dbo.Peticion p
      INNER JOIN dbo.Ciudadano c ON p.IdCiudadano = c.IdCiudadano
      INNER JOIN dbo.Departamento d ON p.IdDepartamento = d.IdDepartamento
      LEFT JOIN dbo.Usuario u ON p.CreadoPorUsuarioId = u.IdUsuario
      WHERE p.IdPeticion = @idPeticion
    `);
  
  if (result.recordset.length === 0) {
    return null;
  }
  
  const peticion = result.recordset[0];
  
  const historialResult = await pool.request()
    .input('idPeticion', sql.BigInt, idPeticion)
    .query(`
      SELECT 
        s.IdSeguimiento,
        s.EstadoAnterior,
        s.EstadoNuevo,
        s.Comentario,
        s.FechaMovimiento,
        u.NombreCompleto AS Usuario
      FROM dbo.Seguimiento s
      LEFT JOIN dbo.Usuario u ON s.IdUsuario = u.IdUsuario
      WHERE s.IdPeticion = @idPeticion
      ORDER BY s.FechaMovimiento DESC
    `);
  
  return {
    idPeticion: peticion.IdPeticion,
    codigo: peticion.Codigo,
    titulo: peticion.Titulo,
    descripcion: peticion.Descripcion,
    estado: peticion.Estado,
    prioridad: peticion.Prioridad,
    fechaCreacion: peticion.FechaCreacion,
    fechaLimite: peticion.FechaLimite,
    fechaCierre: peticion.FechaCierre,
    ciudadano: {
      idCiudadano: peticion.IdCiudadano,
      dpi: peticion.DPI,
      nombres: peticion.Nombres,
      apellidos: peticion.Apellidos,
      telefono: peticion.Telefono,
      correo: peticion.Correo,
      direccion: peticion.Direccion
    },
    departamento: {
      idDepartamento: peticion.IdDepartamento,
      nombre: peticion.NombreDepartamento
    },
    creadoPor: peticion.CreadoPor,
    historial: historialResult.recordset.map(h => ({
      idSeguimiento: h.IdSeguimiento,
      estadoAnterior: h.EstadoAnterior,
      estadoNuevo: h.EstadoNuevo,
      comentario: h.Comentario,
      fechaMovimiento: h.FechaMovimiento,
      usuario: h.Usuario
    }))
  };
};

module.exports = {
  findCiudadanoByDPI,
  createCiudadano,
  generateCodigoPeticion,
  createPeticion,
  createSeguimiento,
  findPeticionById,
  updateEstadoPeticion,
  deletePeticion,
  listPeticiones,
  getPeticionDetalle
};
