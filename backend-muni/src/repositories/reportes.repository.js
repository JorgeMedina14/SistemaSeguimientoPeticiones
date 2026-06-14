const { getPool } = require('../db/pool');
const sql = require('mssql');

const getResumenGeneral = async (fechaInicio, fechaFin) => {
  const pool = await getPool();
  
  let whereClause = '';
  const request = pool.request();
  
  if (fechaInicio && fechaFin) {
    whereClause = 'WHERE FechaCreacion BETWEEN @fechaInicio AND @fechaFin';
    request.input('fechaInicio', sql.Date, fechaInicio);
    request.input('fechaFin', sql.Date, fechaFin);
  }
  
  const totalResult = await request
    .query(`SELECT COUNT(*) AS Total FROM dbo.Peticion ${whereClause}`);
  
  const request2 = pool.request();
  if (fechaInicio && fechaFin) {
    request2.input('fechaInicio', sql.Date, fechaInicio);
    request2.input('fechaFin', sql.Date, fechaFin);
  }
  
  const porEstadoResult = await request2
    .query(`
      SELECT Estado, COUNT(*) AS Total
      FROM dbo.Peticion
      ${whereClause}
      GROUP BY Estado
      ORDER BY Estado
    `);
  
  const request3 = pool.request();
  if (fechaInicio && fechaFin) {
    request3.input('fechaInicio', sql.Date, fechaInicio);
    request3.input('fechaFin', sql.Date, fechaFin);
  }
  
  const porPrioridadResult = await request3
    .query(`
      SELECT Prioridad, COUNT(*) AS Total
      FROM dbo.Peticion
      ${whereClause}
      GROUP BY Prioridad
      ORDER BY 
        CASE Prioridad
          WHEN 'ALTA' THEN 1
          WHEN 'MEDIA' THEN 2
          WHEN 'BAJA' THEN 3
        END
    `);
  
  const request4 = pool.request();
  if (fechaInicio && fechaFin) {
    request4.input('fechaInicio', sql.Date, fechaInicio);
    request4.input('fechaFin', sql.Date, fechaFin);
  }
  
  const resueltasResult = await request4
    .query(`
      SELECT 
        SUM(CASE WHEN Estado IN ('RESUELTA', 'CERRADA') THEN 1 ELSE 0 END) AS TotalResueltas,
        SUM(CASE WHEN Estado NOT IN ('RESUELTA', 'CERRADA') THEN 1 ELSE 0 END) AS TotalPendientes
      FROM dbo.Peticion
      ${whereClause}
    `);
  
  return {
    totalPeticiones: totalResult.recordset[0].Total,
    totalResueltas: resueltasResult.recordset[0].TotalResueltas || 0,
    totalPendientes: resueltasResult.recordset[0].TotalPendientes || 0,
    porEstado: porEstadoResult.recordset.map(r => ({
      estado: r.Estado,
      total: r.Total
    })),
    porPrioridad: porPrioridadResult.recordset.map(r => ({
      prioridad: r.Prioridad,
      total: r.Total
    }))
  };
};

const getPorDepartamento = async (fechaInicio, fechaFin) => {
  const pool = await getPool();
  
  let whereClause = 'd.Activo = 1';
  const request = pool.request();
  
  if (fechaInicio && fechaFin) {
    whereClause += ' AND (p.FechaCreacion IS NULL OR p.FechaCreacion BETWEEN @fechaInicio AND @fechaFin)';
    request.input('fechaInicio', sql.Date, fechaInicio);
    request.input('fechaFin', sql.Date, fechaFin);
  }
  
  const result = await request
    .query(`
      SELECT 
        d.Nombre AS Departamento,
        COUNT(p.IdPeticion) AS CantidadTotal,
        SUM(CASE WHEN p.Estado IN ('RESUELTA', 'CERRADA') THEN 1 ELSE 0 END) AS CantidadResueltas,
        SUM(CASE WHEN p.Estado NOT IN ('RESUELTA', 'CERRADA') THEN 1 ELSE 0 END) AS CantidadPendientes
      FROM dbo.Departamento d
      LEFT JOIN dbo.Peticion p ON d.IdDepartamento = p.IdDepartamento
      WHERE ${whereClause}
      GROUP BY d.Nombre
      ORDER BY CantidadTotal DESC
    `);
  
  return result.recordset.map(r => ({
    departamento: r.Departamento,
    cantidadTotal: r.CantidadTotal,
    cantidadResueltas: r.CantidadResueltas,
    cantidadPendientes: r.CantidadPendientes
  }));
};

const getTiemposPromedio = async (fechaInicio, fechaFin) => {
  const pool = await getPool();
  
  let whereClause = "Estado IN ('RESUELTA', 'CERRADA') AND FechaCierre IS NOT NULL";
  const request = pool.request();
  
  if (fechaInicio && fechaFin) {
    whereClause += ' AND FechaCreacion BETWEEN @fechaInicio AND @fechaFin';
    request.input('fechaInicio', sql.Date, fechaInicio);
    request.input('fechaFin', sql.Date, fechaFin);
  }
  
  const result = await request
    .query(`
      SELECT 
        COUNT(*) AS TotalPeticionesCerradas,
        AVG(DATEDIFF(DAY, FechaCreacion, FechaCierre)) AS PromedioDias,
        MIN(DATEDIFF(DAY, FechaCreacion, FechaCierre)) AS MinimoDias,
        MAX(DATEDIFF(DAY, FechaCreacion, FechaCierre)) AS MaximoDias
      FROM dbo.Peticion
      WHERE ${whereClause}
    `);
  
  const row = result.recordset[0];
  
  return {
    totalPeticionesCerradas: row.TotalPeticionesCerradas,
    promedioDias: row.PromedioDias !== null ? parseFloat(row.PromedioDias.toFixed(2)) : 0,
    minimoDias: row.MinimoDias || 0,
    maximoDias: row.MaximoDias || 0
  };
};

const getCiudadanosFrecuentes = async (filtros) => {
  const pool = await getPool();
  
  const { top, page, limit, fechaInicio, fechaFin, estado, q } = filtros;
  
  let whereConditions = [];
  const request = pool.request();
  
  if (fechaInicio && fechaFin) {
    whereConditions.push('p.FechaCreacion BETWEEN @fechaInicio AND @fechaFin');
    request.input('fechaInicio', sql.Date, fechaInicio);
    request.input('fechaFin', sql.Date, fechaFin);
  }
  
  if (estado) {
    whereConditions.push('p.Estado = @estado');
    request.input('estado', sql.VarChar(20), estado);
  }
  
  if (q) {
    whereConditions.push('(c.DPI LIKE @q OR c.Nombres LIKE @q OR c.Apellidos LIKE @q)');
    request.input('q', sql.NVarChar(200), `%${q}%`);
  }
  
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
  const countRequest = pool.request();
  if (fechaInicio && fechaFin) {
    countRequest.input('fechaInicio', sql.Date, fechaInicio);
    countRequest.input('fechaFin', sql.Date, fechaFin);
  }
  if (estado) {
    countRequest.input('estado', sql.VarChar(20), estado);
  }
  if (q) {
    countRequest.input('q', sql.NVarChar(200), `%${q}%`);
  }
  
  const countResult = await countRequest.query(`
    SELECT COUNT(DISTINCT c.IdCiudadano) AS Total
    FROM dbo.Ciudadano c
    INNER JOIN dbo.Peticion p ON c.IdCiudadano = p.IdCiudadano
    ${whereClause}
  `);
  
  const total = countResult.recordset[0].Total;
  
  let paginationClause = '';
  
  if (top) {
    paginationClause = `TOP ${top}`;
  } else if (page && limit) {
    const offset = (page - 1) * limit;
    paginationClause = `OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
  }
  
  const topClause = top ? `TOP ${top}` : '';
  const orderByClause = top ? '' : 'ORDER BY TotalPeticiones DESC';
  const paginationFinal = (page && limit && !top) ? paginationClause : '';
  
  const result = await request.query(`
    SELECT ${topClause}
      c.IdCiudadano,
      c.DPI,
      CONCAT(c.Nombres, ' ', c.Apellidos) AS NombreCompleto,
      c.Telefono,
      c.Correo,
      COUNT(p.IdPeticion) AS TotalPeticiones,
      MAX(p.FechaCreacion) AS UltimaPeticion
    FROM dbo.Ciudadano c
    INNER JOIN dbo.Peticion p ON c.IdCiudadano = p.IdCiudadano
    ${whereClause}
    GROUP BY c.IdCiudadano, c.DPI, c.Nombres, c.Apellidos, c.Telefono, c.Correo
    ${orderByClause}
    ${paginationFinal}
  `);
  
  return {
    data: result.recordset.map(r => ({
      idCiudadano: r.IdCiudadano,
      dpi: r.DPI,
      nombreCompleto: r.NombreCompleto,
      telefono: r.Telefono,
      correo: r.Correo,
      totalPeticiones: r.TotalPeticiones,
      ultimaPeticion: r.UltimaPeticion
    })),
    total,
    page: page || 1,
    limit: limit || total
  };
};

const getDashboardOverview = async (fechaInicio, fechaFin) => {
  const pool = await getPool();
  
  let whereClause = '';
  let whereClausePeticion = '';
  const params = {};
  
  if (fechaInicio && fechaFin) {
    whereClause = 'WHERE p.FechaCreacion BETWEEN @fechaInicio AND @fechaFin';
    whereClausePeticion = 'WHERE FechaCreacion BETWEEN @fechaInicio AND @fechaFin';
    params.fechaInicio = fechaInicio;
    params.fechaFin = fechaFin;
  }
  
  const request1 = pool.request();
  if (params.fechaInicio) {
    request1.input('fechaInicio', sql.Date, params.fechaInicio);
    request1.input('fechaFin', sql.Date, params.fechaFin);
  }
  const totalResult = await request1.query(`
    SELECT COUNT(*) AS Total FROM dbo.Peticion ${whereClausePeticion}
  `);
  
  const request2 = pool.request();
  if (params.fechaInicio) {
    request2.input('fechaInicio', sql.Date, params.fechaInicio);
    request2.input('fechaFin', sql.Date, params.fechaFin);
  }
  const estadoResult = await request2.query(`
    SELECT Estado, COUNT(*) AS Total
    FROM dbo.Peticion
    ${whereClausePeticion}
    GROUP BY Estado
  `);
  
  const request3 = pool.request();
  if (params.fechaInicio) {
    request3.input('fechaInicio', sql.Date, params.fechaInicio);
    request3.input('fechaFin', sql.Date, params.fechaFin);
  }
  const prioridadResult = await request3.query(`
    SELECT Prioridad, COUNT(*) AS Total
    FROM dbo.Peticion
    ${whereClausePeticion}
    GROUP BY Prioridad
  `);
  
  const request4 = pool.request();
  if (params.fechaInicio) {
    request4.input('fechaInicio', sql.Date, params.fechaInicio);
    request4.input('fechaFin', sql.Date, params.fechaFin);
  }

  let whereClauseDepartamento = 'WHERE d.Activo = 1';
  if (params.fechaInicio) {
    whereClauseDepartamento += ' AND p.FechaCreacion BETWEEN @fechaInicio AND @fechaFin';
  }

  const sqlDepto = `
    SELECT 
      d.Nombre AS Departamento,
      COUNT(p.IdPeticion) AS Total
    FROM dbo.Departamento d
    LEFT JOIN dbo.Peticion p ON d.IdDepartamento = p.IdDepartamento
    ${whereClauseDepartamento}
    GROUP BY d.Nombre
  `;
  console.log('SQL - depto:', sqlDepto.replace(/\n\s+/g, ' '));
  const deptoResult = await request4.query(sqlDepto);
  
  const request5 = pool.request();
  if (params.fechaInicio) {
    request5.input('fechaInicio', sql.Date, params.fechaInicio);
    request5.input('fechaFin', sql.Date, params.fechaFin);
  }
  const sqlTiempos = `
    SELECT 
      AVG(DATEDIFF(DAY, FechaCreacion, FechaCierre)) AS PromedioDias,
      SUM(CASE WHEN Estado IN ('RESUELTA', 'CERRADA') THEN 1 ELSE 0 END) AS TotalResueltas,
      SUM(CASE WHEN Estado NOT IN ('RESUELTA', 'CERRADA') THEN 1 ELSE 0 END) AS TotalPendientes
    FROM dbo.Peticion
    WHERE Estado IN ('RESUELTA', 'CERRADA') AND FechaCierre IS NOT NULL
    ${params.fechaInicio ? 'AND FechaCreacion BETWEEN @fechaInicio AND @fechaFin' : ''}
  `;
  console.log('SQL - tiempos:', sqlTiempos.replace(/\n\s+/g, ' '));
  const tiemposResult = await request5.query(sqlTiempos);
  
  const request6 = pool.request();
  if (params.fechaInicio) {
    request6.input('fechaInicio', sql.Date, params.fechaInicio);
    request6.input('fechaFin', sql.Date, params.fechaFin);
  }
  const sqlTop5 = `
    SELECT TOP 5
      c.IdCiudadano,
      CONCAT(c.Nombres, ' ', c.Apellidos) AS NombreCompleto,
      COUNT(p.IdPeticion) AS TotalPeticiones
    FROM dbo.Ciudadano c
    INNER JOIN dbo.Peticion p ON c.IdCiudadano = p.IdCiudadano
    ${whereClause}
    GROUP BY c.IdCiudadano, c.Nombres, c.Apellidos
    ORDER BY TotalPeticiones DESC
  `;
  console.log('SQL - top5:', sqlTop5.replace(/\n\s+/g, ' '));
  const top5Result = await request6.query(sqlTop5);
  
  const request7 = pool.request();
  const movimientosResult = await request7.query(`
    SELECT TOP 10
      s.IdSeguimiento,
      s.IdPeticion,
      p.Codigo,
      s.EstadoAnterior,
      s.EstadoNuevo,
      s.Comentario,
      s.FechaMovimiento,
      u.NombreCompleto AS Usuario
    FROM dbo.Seguimiento s
    INNER JOIN dbo.Peticion p ON s.IdPeticion = p.IdPeticion
    LEFT JOIN dbo.Usuario u ON s.IdUsuario = u.IdUsuario
    ORDER BY s.FechaMovimiento DESC
  `);
  
  const totalPeticiones = totalResult.recordset[0].Total;
  const tiempos = tiemposResult.recordset[0];

  const estadosResueltos = ['RESUELTA', 'CERRADA'];
  const totalResueltas = estadoResult.recordset
    .filter((r) => estadosResueltos.includes(r.Estado))
    .reduce((sum, r) => sum + r.Total, 0);
  const totalPendientes = Math.max(0, totalPeticiones - totalResueltas);
  
  return {
    totalPeticiones,
    porEstado: estadoResult.recordset.map(r => ({ estado: r.Estado, total: r.Total })),
    porPrioridad: prioridadResult.recordset.map(r => ({ prioridad: r.Prioridad, total: r.Total })),
    porDepartamento: deptoResult.recordset.map(r => ({ departamento: r.Departamento, total: r.Total })),
    promedioDiasResolucion: tiempos.PromedioDias ? parseFloat(tiempos.PromedioDias.toFixed(2)) : 0,
    porcentajeResueltas: totalPeticiones > 0 ? parseFloat(((totalResueltas / totalPeticiones) * 100).toFixed(2)) : 0,
    porcentajePendientes: totalPeticiones > 0 ? parseFloat(((totalPendientes / totalPeticiones) * 100).toFixed(2)) : 0,
    top5CiudadanosFrecuentes: top5Result.recordset.map(r => ({
      idCiudadano: r.IdCiudadano,
      nombreCompleto: r.NombreCompleto,
      totalPeticiones: r.TotalPeticiones
    })),
    ultimos10Movimientos: movimientosResult.recordset.map(r => ({
      idSeguimiento: r.IdSeguimiento,
      idPeticion: r.IdPeticion,
      codigo: r.Codigo,
      estadoAnterior: r.EstadoAnterior,
      estadoNuevo: r.EstadoNuevo,
      comentario: r.Comentario,
      fechaMovimiento: r.FechaMovimiento,
      usuario: r.Usuario
    }))
  };
};

module.exports = {
  getResumenGeneral,
  getPorDepartamento,
  getTiemposPromedio,
  getCiudadanosFrecuentes,
  getDashboardOverview
};
