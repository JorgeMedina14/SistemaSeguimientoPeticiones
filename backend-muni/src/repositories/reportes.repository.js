const { withPool } = require('../db/pool');
const sql = require('../db/sql');

const bindFechas = (request, fechaInicio, fechaFin) => {
  if (fechaInicio && fechaFin) {
    request.input('fechaInicio', sql.Date, fechaInicio);
    request.input('fechaFin', sql.Date, fechaFin);
  }
  return request;
};

const queryFechas = (pool, fechaInicio, fechaFin, text) =>
  bindFechas(pool.request(), fechaInicio, fechaFin).query(text);

const getResumenGeneral = async (fechaInicio, fechaFin) =>
  withPool(async (pool) => {
    const whereClause =
      fechaInicio && fechaFin ? 'WHERE FechaCreacion BETWEEN @fechaInicio AND @fechaFin' : '';

    const totalResult = await queryFechas(
      pool,
      fechaInicio,
      fechaFin,
      `SELECT COUNT(*) AS Total FROM dbo.Peticion ${whereClause}`
    );

    const porEstadoResult = await queryFechas(
      pool,
      fechaInicio,
      fechaFin,
      `
      SELECT Estado, COUNT(*) AS Total
      FROM dbo.Peticion
      ${whereClause}
      GROUP BY Estado
      ORDER BY Estado
    `
    );

    const porPrioridadResult = await queryFechas(
      pool,
      fechaInicio,
      fechaFin,
      `
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
    `
    );

    const resueltasResult = await queryFechas(
      pool,
      fechaInicio,
      fechaFin,
      `
      SELECT
        SUM(CASE WHEN Estado IN ('RESUELTA', 'CERRADA') THEN 1 ELSE 0 END) AS TotalResueltas,
        SUM(CASE WHEN Estado NOT IN ('RESUELTA', 'CERRADA') THEN 1 ELSE 0 END) AS TotalPendientes
      FROM dbo.Peticion
      ${whereClause}
    `
    );

    return {
      totalPeticiones: totalResult.recordset[0].Total,
      totalResueltas: resueltasResult.recordset[0].TotalResueltas || 0,
      totalPendientes: resueltasResult.recordset[0].TotalPendientes || 0,
      porEstado: porEstadoResult.recordset.map((r) => ({
        estado: r.Estado,
        total: r.Total
      })),
      porPrioridad: porPrioridadResult.recordset.map((r) => ({
        prioridad: r.Prioridad,
        total: r.Total
      }))
    };
  });

const getPorDepartamento = async (fechaInicio, fechaFin) =>
  withPool(async (pool) => {
    let whereClause = 'd.Activo = 1';
    const request = pool.request();

    if (fechaInicio && fechaFin) {
      whereClause +=
        ' AND (p.FechaCreacion IS NULL OR p.FechaCreacion BETWEEN @fechaInicio AND @fechaFin)';
      bindFechas(request, fechaInicio, fechaFin);
    }

    const result = await request.query(`
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

    return result.recordset.map((r) => ({
      departamento: r.Departamento,
      cantidadTotal: r.CantidadTotal,
      cantidadResueltas: r.CantidadResueltas,
      cantidadPendientes: r.CantidadPendientes
    }));
  });

const getTiemposPromedio = async (fechaInicio, fechaFin) =>
  withPool(async (pool) => {
    let whereClause = "Estado IN ('RESUELTA', 'CERRADA') AND FechaCierre IS NOT NULL";
    const request = pool.request();

    if (fechaInicio && fechaFin) {
      whereClause += ' AND FechaCreacion BETWEEN @fechaInicio AND @fechaFin';
      bindFechas(request, fechaInicio, fechaFin);
    }

    const result = await request.query(`
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
      promedioDias: row.PromedioDias !== null ? parseFloat(Number(row.PromedioDias).toFixed(1)) : 0,
      minimoDias: row.MinimoDias || 0,
      maximoDias: row.MaximoDias || 0
    };
  });

const getCiudadanosFrecuentes = async (filtros) =>
  withPool(async (pool) => {
    const { top, page, limit, fechaInicio, fechaFin, estado, q } = filtros;

    const whereConditions = [];
    if (fechaInicio && fechaFin) {
      whereConditions.push('p.FechaCreacion BETWEEN @fechaInicio AND @fechaFin');
    }
    if (estado) {
      whereConditions.push('p.Estado = @estado');
    }
    if (q) {
      whereConditions.push('(c.DPI LIKE @q OR c.Nombres LIKE @q OR c.Apellidos LIKE @q)');
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const bindFilters = (request) => {
      bindFechas(request, fechaInicio, fechaFin);
      if (estado) request.input('estado', sql.VarChar(20), estado);
      if (q) request.input('q', sql.NVarChar(200), `%${q}%`);
      return request;
    };

    const countResult = await bindFilters(pool.request()).query(`
      SELECT COUNT(DISTINCT c.IdCiudadano) AS Total
      FROM dbo.Ciudadano c
      INNER JOIN dbo.Peticion p ON c.IdCiudadano = p.IdCiudadano
      ${whereClause}
    `);

    const total = countResult.recordset[0].Total;
    const safeTop =
      Number.isFinite(Number(top)) && Number(top) > 0 ? Math.min(Number(top), 100) : null;
    const safePage = Number(page) > 0 ? Number(page) : 1;
    const safeLimit =
      Number(limit) > 0 ? Math.min(Number(limit), 100) : null;
    const topClause = safeTop ? `TOP (${safeTop})` : '';
    const paginationFinal =
      !safeTop && safeLimit
        ? `OFFSET ${(safePage - 1) * safeLimit} ROWS FETCH NEXT ${safeLimit} ROWS ONLY`
        : '';

    const result = await bindFilters(pool.request()).query(`
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
      ORDER BY TotalPeticiones DESC
      ${paginationFinal}
    `);

    return {
      data: result.recordset.map((r) => ({
        idCiudadano: r.IdCiudadano,
        dpi: r.DPI,
        nombreCompleto: r.NombreCompleto,
        telefono: r.Telefono,
        correo: r.Correo,
        totalPeticiones: r.TotalPeticiones,
        ultimaPeticion: r.UltimaPeticion
      })),
      total,
      page: safePage,
      limit: safeTop || safeLimit || total
    };
  });

const getDashboardOverview = async (fechaInicio, fechaFin) =>
  withPool(async (pool) => {
    const filtrar = Boolean(fechaInicio && fechaFin);
    const whereClause = filtrar ? 'WHERE p.FechaCreacion BETWEEN @fechaInicio AND @fechaFin' : '';
    const whereClausePeticion = filtrar ? 'WHERE FechaCreacion BETWEEN @fechaInicio AND @fechaFin' : '';
    const q = (text) => queryFechas(pool, fechaInicio, fechaFin, text);

    const totalResult = await q(`SELECT COUNT(*) AS Total FROM dbo.Peticion ${whereClausePeticion}`);

    const estadoResult = await q(`
      SELECT Estado, COUNT(*) AS Total
      FROM dbo.Peticion
      ${whereClausePeticion}
      GROUP BY Estado
    `);

    const prioridadResult = await q(`
      SELECT Prioridad, COUNT(*) AS Total
      FROM dbo.Peticion
      ${whereClausePeticion}
      GROUP BY Prioridad
    `);

    const deptoResult = await q(`
      SELECT
        d.Nombre AS Departamento,
        COUNT(p.IdPeticion) AS Total
      FROM dbo.Departamento d
      LEFT JOIN dbo.Peticion p ON d.IdDepartamento = p.IdDepartamento
        ${filtrar ? 'AND p.FechaCreacion BETWEEN @fechaInicio AND @fechaFin' : ''}
      WHERE d.Activo = 1
      GROUP BY d.Nombre
    `);

    const tiemposResult = await q(`
      SELECT
        AVG(DATEDIFF(DAY, FechaCreacion, FechaCierre)) AS PromedioDias
      FROM dbo.Peticion
      WHERE Estado IN ('RESUELTA', 'CERRADA') AND FechaCierre IS NOT NULL
      ${filtrar ? 'AND FechaCreacion BETWEEN @fechaInicio AND @fechaFin' : ''}
    `);

    const top5Result = await q(`
      SELECT TOP 5
        c.IdCiudadano,
        CONCAT(c.Nombres, ' ', c.Apellidos) AS NombreCompleto,
        COUNT(p.IdPeticion) AS TotalPeticiones
      FROM dbo.Ciudadano c
      INNER JOIN dbo.Peticion p ON c.IdCiudadano = p.IdCiudadano
      ${whereClause}
      GROUP BY c.IdCiudadano, c.Nombres, c.Apellidos
      ORDER BY TotalPeticiones DESC
    `);

    const movimientosResult = await pool.request().query(`
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
      porEstado: estadoResult.recordset.map((r) => ({ estado: r.Estado, total: r.Total })),
      porPrioridad: prioridadResult.recordset.map((r) => ({
        prioridad: r.Prioridad,
        total: r.Total
      })),
      porDepartamento: deptoResult.recordset.map((r) => ({
        departamento: r.Departamento,
        total: r.Total
      })),
      promedioDiasResolucion:
        tiempos.PromedioDias != null ? parseFloat(Number(tiempos.PromedioDias).toFixed(1)) : 0,
      porcentajeResueltas:
        totalPeticiones > 0
          ? parseFloat(((totalResueltas / totalPeticiones) * 100).toFixed(1))
          : 0,
      porcentajePendientes:
        totalPeticiones > 0
          ? parseFloat(((totalPendientes / totalPeticiones) * 100).toFixed(1))
          : 0,
      top5CiudadanosFrecuentes: top5Result.recordset.map((r) => ({
        idCiudadano: r.IdCiudadano,
        nombreCompleto: r.NombreCompleto,
        totalPeticiones: r.TotalPeticiones
      })),
      ultimos10Movimientos: movimientosResult.recordset.map((r) => ({
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
  });

module.exports = {
  getResumenGeneral,
  getPorDepartamento,
  getTiemposPromedio,
  getCiudadanosFrecuentes,
  getDashboardOverview
};
