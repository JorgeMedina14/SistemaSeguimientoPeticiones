/*
================================================================================
  reset_datos_demo_tesis.sql
  Sistema Web — Peticiones Ciudadanas (Municipalidad)
  BD: MuniPeticionesJalapa | Instancia: localhost\SQLEXPRESS

  PROPÓSITO (reproducible para demostración / tesis):
  1) Respaldo lógico (SELECT de conteos + volcado a tablas temporales de sesión)
  2) Eliminar Seguimiento y Peticion (respeta FK; sin DROP/TRUNCATE)
  3) Crear ciudadanos ficticios académicos (si faltan)
  4) Insertar EXACTAMENTE 40 peticiones JAL-2026-000001 .. 000040
  5) Insertar seguimientos coherentes con el estado final
  6) Ajustar SecuenciaCodigo.CorrelativoActual = 40
  7) Validar; COMMIT solo si todo OK; si no, ROLLBACK

  ADAPTACIÓN A CONSTRAINT REAL CK_Peticion_Estado:
  El documento de tesis usa "PENDIENTE", pero el CHECK de la BD SOLO permite:
    RECIBIDA, EN_REVISION, ASIGNADA, EN_PROCESO, RESUELTA, RECHAZADA, CERRADA
  Por tanto, las 4 peticiones "PENDIENTE" se cargan como EN_REVISION
  (equivalente operativo: en espera / pendiente de material o coordinación).
  "EN PROCESO" del documento → EN_PROCESO en BD.

  NO modifica: usuarios, departamentos, roles, estructura, constraints.
================================================================================
*/
USE MuniPeticionesJalapa;
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

BEGIN TRANSACTION;

BEGIN TRY
    /*------------------------------------------------------------------
      0) Variables de control / mapeo departamentos reales
    ------------------------------------------------------------------*/
    /* Match por patrón (evita fallos de encoding en sqlcmd con tildes) */
    DECLARE @IdDespacho INT = (SELECT TOP 1 IdDepartamento FROM dbo.Departamento WHERE Nombre LIKE N'%DESPACHO%' AND Nombre LIKE N'%ALCALD%');
    DECLARE @IdAtencion INT = (SELECT TOP 1 IdDepartamento FROM dbo.Departamento WHERE Nombre LIKE N'%ATENCI%' AND Nombre LIKE N'%CIUDADAN%');
    DECLARE @IdObras    INT = (SELECT TOP 1 IdDepartamento FROM dbo.Departamento WHERE Nombre LIKE N'%OBRAS%');
    DECLARE @IdJalapa   INT = (SELECT TOP 1 IdDepartamento FROM dbo.Departamento WHERE Nombre LIKE N'%JALAPAGUA%');
    DECLARE @IdElectrica INT = (SELECT TOP 1 IdDepartamento FROM dbo.Departamento WHERE Nombre LIKE N'%ELECTRICA%' OR Nombre LIKE N'%ELÉCTRICA%');

    IF @IdDespacho IS NULL OR @IdAtencion IS NULL OR @IdObras IS NULL OR @IdJalapa IS NULL OR @IdElectrica IS NULL
        THROW 50001, 'Faltan departamentos base. Abortando.', 1;

    DECLARE @IdCreador INT = (
        SELECT TOP (1) IdUsuario FROM dbo.Usuario
        WHERE Username = 'recepcion' AND Activo = 1
        ORDER BY IdUsuario
    );
    IF @IdCreador IS NULL
        SET @IdCreador = (SELECT TOP (1) IdUsuario FROM dbo.Usuario WHERE Username = 'alcalde' AND Activo = 1);
    IF @IdCreador IS NULL
        SET @IdCreador = (SELECT TOP (1) IdUsuario FROM dbo.Usuario WHERE Activo = 1 ORDER BY IdUsuario);
    IF @IdCreador IS NULL
        THROW 50002, 'No hay usuario activo para CreadoPorUsuarioId.', 1;

    DECLARE @IdSeguimientoUser INT = (
        SELECT TOP (1) IdUsuario FROM dbo.Usuario WHERE Username = 'alcalde' AND Activo = 1
    );
    IF @IdSeguimientoUser IS NULL SET @IdSeguimientoUser = @IdCreador;

    /*------------------------------------------------------------------
      1) Respaldo lógico en tablas temporales (sesión)
    ------------------------------------------------------------------*/
    IF OBJECT_ID('tempdb..#bak_Peticion') IS NOT NULL DROP TABLE #bak_Peticion;
    IF OBJECT_ID('tempdb..#bak_Seguimiento') IS NOT NULL DROP TABLE #bak_Seguimiento;

    SELECT * INTO #bak_Peticion FROM dbo.Peticion;
    SELECT * INTO #bak_Seguimiento FROM dbo.Seguimiento;

    DECLARE @ElimPet INT = (SELECT COUNT(*) FROM #bak_Peticion);
    DECLARE @ElimSeg INT = (SELECT COUNT(*) FROM #bak_Seguimiento);

    PRINT CONCAT('Respaldo temporal: Peticion=', @ElimPet, ' Seguimiento=', @ElimSeg);
    PRINT CONCAT('Usuario creador IdUsuario=', @IdCreador);

    /*------------------------------------------------------------------
      2) Limpieza segura (orden FK)
         FK_Seguimiento_Peticion tiene ON DELETE CASCADE, pero se borra
         Seguimiento primero de forma explícita.
    ------------------------------------------------------------------*/
    DELETE FROM dbo.Seguimiento;
    DELETE FROM dbo.Peticion;

    IF (SELECT COUNT(*) FROM dbo.Peticion) <> 0
        THROW 50003, 'Peticion no quedó vacía tras DELETE.', 1;

    /* Ciudadanos huérfanos claramente de prueba (DPI 9... o correo @demo.tesis.local) */
    DELETE FROM dbo.Ciudadano
    WHERE IdCiudadano NOT IN (SELECT DISTINCT IdCiudadano FROM dbo.Peticion)
      AND (
            DPI LIKE '9%'
         OR Correo LIKE '%@demo.tesis.local'
         OR Direccion LIKE N'%datos académicos%'
         OR Direccion LIKE N'%Dirección ficticia tesis%'
         OR Direccion LIKE N'%prueba académica%'
      );

    /*------------------------------------------------------------------
      3) Ciudadanos ficticios académicos (15)
    ------------------------------------------------------------------*/
    DECLARE @Ciu TABLE (
        Ord INT PRIMARY KEY,
        DPI VARCHAR(13) NOT NULL,
        Nombres NVARCHAR(120) NOT NULL,
        Apellidos NVARCHAR(120) NOT NULL,
        Telefono VARCHAR(20) NULL,
        Correo NVARCHAR(150) NULL,
        Direccion NVARCHAR(250) NULL
    );

    INSERT INTO @Ciu (Ord, DPI, Nombres, Apellidos, Telefono, Correo, Direccion) VALUES
    (1,  '9100000000001', N'Ana',     N'López Demo',      '55561001', N'ana.lopez.demo@demo.tesis.local',     N'Jalapa Centro — datos académicos'),
    (2,  '9100000000002', N'Bruno',   N'Méndez Demo',     '55561002', N'bruno.mendez.demo@demo.tesis.local',  N'Zona 1 Jalapa — datos académicos'),
    (3,  '9100000000003', N'Carla',   N'Ruiz Demo',       '55561003', N'carla.ruiz.demo@demo.tesis.local',    N'Zona 2 Jalapa — datos académicos'),
    (4,  '9100000000004', N'Diego',   N'Soto Demo',       '55561004', N'diego.soto.demo@demo.tesis.local',    N'Col. El Porvenir — datos académicos'),
    (5,  '9100000000005', N'Elena',   N'Vargas Demo',     '55561005', N'elena.vargas.demo@demo.tesis.local',  N'Aldea prueba A — datos académicos'),
    (6,  '9100000000006', N'Felipe',  N'Castillo Demo',   '55561006', N'felipe.castillo.demo@demo.tesis.local', N'Aldea prueba B — datos académicos'),
    (7,  '9100000000007', N'Gina',    N'Paredes Demo',    '55561007', N'gina.paredes.demo@demo.tesis.local',  N'Barrio El Centro — datos académicos'),
    (8,  '9100000000008', N'Hugo',    N'Navarro Demo',    '55561008', N'hugo.navarro.demo@demo.tesis.local',  N'Sector Norte — datos académicos'),
    (9,  '9100000000009', N'Irene',   N'Gálvez Demo',     '55561009', N'irene.galvez.demo@demo.tesis.local',  N'Sector Sur — datos académicos'),
    (10, '9100000000010', N'Jorge',   N'Pineda Demo',     '55561010', N'jorge.pineda.demo@demo.tesis.local',  N'Calle Principal ficticia — datos académicos'),
    (11, '9100000000011', N'Karen',   N'Ortega Demo',     '55561011', N'karen.ortega.demo@demo.tesis.local',  N'Avenida Demo 1 — datos académicos'),
    (12, '9100000000012', N'Luis',    N'Herrera Demo',    '55561012', N'luis.herrera.demo@demo.tesis.local',  N'Avenida Demo 2 — datos académicos'),
    (13, '9100000000013', N'Marta',   N'Rojas Demo',      '55561013', N'marta.rojas.demo@demo.tesis.local',   N'Residenciales Demo — datos académicos'),
    (14, '9100000000014', N'Nestor',  N'Quiñónez Demo',   '55561014', N'nestor.quinonez.demo@demo.tesis.local', N'Colonia Demo Este — datos académicos'),
    (15, '9100000000015', N'Olga',    N'Bautista Demo',   '55561015', N'olga.bautista.demo@demo.tesis.local', N'Colonia Demo Oeste — datos académicos');

    INSERT INTO dbo.Ciudadano (DPI, Nombres, Apellidos, Telefono, Correo, Direccion, Activo, FechaRegistro)
    SELECT c.DPI, c.Nombres, c.Apellidos, c.Telefono, c.Correo, c.Direccion, 1, CAST('2026-05-01T08:00:00' AS datetime2(0))
    FROM @Ciu c
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Ciudadano x WHERE x.DPI = c.DPI);

    DECLARE @CiuCreados INT = (
        SELECT COUNT(*) FROM dbo.Ciudadano WHERE DPI LIKE '91000000000%'
    );

    /* Mapa Ord → IdCiudadano */
    DECLARE @MapCiu TABLE (Ord INT PRIMARY KEY, IdCiudadano INT NOT NULL);
    INSERT INTO @MapCiu (Ord, IdCiudadano)
    SELECT c.Ord, ci.IdCiudadano
    FROM @Ciu c
    INNER JOIN dbo.Ciudadano ci ON ci.DPI = c.DPI;

    /*------------------------------------------------------------------
      4) Definición de las 40 peticiones (documento tesis)
         EstadoDoc: RECIBIDA | EN_PROCESO | PENDIENTE | RESUELTA
         EstadoBD:  PENDIENTE → EN_REVISION
    ------------------------------------------------------------------*/
    DECLARE @Pets TABLE (
        N INT PRIMARY KEY,
        Codigo VARCHAR(25) NOT NULL,
        Titulo NVARCHAR(200) NOT NULL,
        Descripcion NVARCHAR(MAX) NOT NULL,
        IdDepartamento INT NOT NULL,
        EstadoBD VARCHAR(20) NOT NULL,
        Prioridad VARCHAR(10) NOT NULL,
        FechaCreacion datetime2(0) NOT NULL,
        OrdCiudadano INT NOT NULL
    );

    /* Descripciones por título (plantillas) */
    DECLARE @D_Fuga NVARCHAR(MAX) = N'Se reporta fuga de agua en la vía pública que provoca desperdicio constante y acumulación de agua. (Dato académico de prueba)';
    DECLARE @D_Drenaje NVARCHAR(MAX) = N'Se solicita revisión y reparación de drenaje con obstrucción y riesgo de inundación local. (Dato académico de prueba)';
    DECLARE @D_FaltaAgua NVARCHAR(MAX) = N'Se reporta falta de agua en el sector, afectando el suministro doméstico de varias viviendas. (Dato académico de prueba)';
    DECLARE @D_Bache NVARCHAR(MAX) = N'Se solicita revisión y reparación de bache que dificulta la circulación vehicular. (Dato académico de prueba)';
    DECLARE @D_Calle NVARCHAR(MAX) = N'Se solicita mantenimiento de calle por deterioro superficial y dust/barro en temporada de lluvia. (Dato académico de prueba)';
    DECLARE @D_Alumbrado NVARCHAR(MAX) = N'Se reporta falla de alumbrado público que reduce visibilidad nocturna en la zona. (Dato académico de prueba)';
    DECLARE @D_Poste NVARCHAR(MAX) = N'Se reporta poste eléctrico en mal estado con riesgo para peatones y cableado. (Dato académico de prueba)';
    DECLARE @D_Basura NVARCHAR(MAX) = N'Se reporta acumulación de basura en vía pública que genera malos olores y focos de contaminación. (Dato académico de prueba)';
    DECLARE @D_Arbol NVARCHAR(MAX) = N'Se reporta árbol con ramas deterioradas que podrían caer sobre la vía pública. (Dato académico de prueba)';
    DECLARE @D_Apoyo NVARCHAR(MAX) = N'Solicitud de apoyo municipal para gestionar una necesidad comunitaria del sector. (Dato académico de prueba)';

    /* Fechas mayo–septiembre 2026 (sin fechas futuras respecto al periodo documentado) */
    INSERT INTO @Pets (N, Codigo, Titulo, Descripcion, IdDepartamento, EstadoBD, Prioridad, FechaCreacion, OrdCiudadano) VALUES
    (1,  'JAL-2026-000001', N'Fuga de agua potable',              @D_Fuga,     @IdJalapa,    'RECIBIDA',   'ALTA',  '2026-05-04T09:10:00', 1),
    (2,  'JAL-2026-000002', N'Reparación de drenaje',             @D_Drenaje,  @IdJalapa,    'RECIBIDA',   'MEDIA', '2026-05-08T10:20:00', 2),
    (3,  'JAL-2026-000003', N'Falta de agua en sector',           @D_FaltaAgua,@IdJalapa,    'RECIBIDA',   'MEDIA', '2026-05-12T11:00:00', 3),
    (4,  'JAL-2026-000004', N'Bache en calle principal',          @D_Bache,    @IdJalapa,    'RECIBIDA',   'BAJA',  '2026-05-16T08:30:00', 4),
    (5,  'JAL-2026-000005', N'Mantenimiento de calle',            @D_Calle,    @IdJalapa,    'RECIBIDA',   'ALTA',  '2026-05-20T14:15:00', 5),
    (6,  'JAL-2026-000006', N'Reparación de alumbrado público',   @D_Alumbrado,@IdJalapa,    'RECIBIDA',   'MEDIA', '2026-05-24T16:40:00', 6),
    (7,  'JAL-2026-000007', N'Poste eléctrico en mal estado',     @D_Poste,    @IdJalapa,    'RECIBIDA',   'MEDIA', '2026-05-28T09:50:00', 7),
    (8,  'JAL-2026-000008', N'Acumulación de basura',             @D_Basura,   @IdJalapa,    'RECIBIDA',   'BAJA',  '2026-06-02T10:05:00', 8),
    (9,  'JAL-2026-000009', N'Árbol que representa riesgo',       @D_Arbol,    @IdJalapa,    'RECIBIDA',   'ALTA',  '2026-06-06T11:25:00', 9),
    (10, 'JAL-2026-000010', N'Solicitud de apoyo municipal',      @D_Apoyo,    @IdJalapa,    'RECIBIDA',   'MEDIA', '2026-06-10T13:00:00', 10),

    (11, 'JAL-2026-000011', N'Fuga de agua potable',              @D_Fuga,     @IdObras,     'RECIBIDA',   'MEDIA', '2026-06-14T09:00:00', 11),
    (12, 'JAL-2026-000012', N'Reparación de drenaje',             @D_Drenaje,  @IdObras,     'RECIBIDA',   'BAJA',  '2026-06-18T10:30:00', 12),
    (13, 'JAL-2026-000013', N'Falta de agua en sector',           @D_FaltaAgua,@IdObras,     'RECIBIDA',   'ALTA',  '2026-06-22T11:45:00', 13),
    (14, 'JAL-2026-000014', N'Bache en calle principal',          @D_Bache,    @IdObras,     'RECIBIDA',   'MEDIA', '2026-06-26T08:20:00', 14),
    (15, 'JAL-2026-000015', N'Mantenimiento de calle',            @D_Calle,    @IdObras,     'EN_PROCESO', 'MEDIA', '2026-07-01T09:15:00', 15),
    (16, 'JAL-2026-000016', N'Reparación de alumbrado público',   @D_Alumbrado,@IdObras,     'EN_PROCESO', 'BAJA',  '2026-07-05T10:40:00', 1),
    (17, 'JAL-2026-000017', N'Poste eléctrico en mal estado',     @D_Poste,    @IdObras,     'EN_PROCESO', 'ALTA',  '2026-07-09T12:10:00', 2),
    (18, 'JAL-2026-000018', N'Acumulación de basura',             @D_Basura,   @IdObras,     'EN_PROCESO', 'MEDIA', '2026-07-13T14:00:00', 3),
    (19, 'JAL-2026-000019', N'Árbol que representa riesgo',       @D_Arbol,    @IdObras,     'EN_PROCESO', 'MEDIA', '2026-07-17T15:20:00', 4),
    (20, 'JAL-2026-000020', N'Solicitud de apoyo municipal',      @D_Apoyo,    @IdObras,     'EN_PROCESO', 'BAJA',  '2026-07-21T09:35:00', 5),

    (21, 'JAL-2026-000021', N'Fuga de agua potable',              @D_Fuga,     @IdElectrica, 'EN_PROCESO', 'ALTA',  '2026-07-25T10:00:00', 6),
    (22, 'JAL-2026-000022', N'Reparación de drenaje',             @D_Drenaje,  @IdElectrica, 'EN_PROCESO', 'MEDIA', '2026-07-29T11:20:00', 7),
    (23, 'JAL-2026-000023', N'Falta de agua en sector',           @D_FaltaAgua,@IdElectrica, 'EN_REVISION','MEDIA', '2026-08-03T08:50:00', 8),  -- PENDIENTE→EN_REVISION
    (24, 'JAL-2026-000024', N'Bache en calle principal',          @D_Bache,    @IdElectrica, 'EN_REVISION','BAJA',  '2026-08-07T09:40:00', 9),
    (25, 'JAL-2026-000025', N'Mantenimiento de calle',            @D_Calle,    @IdElectrica, 'EN_REVISION','ALTA',  '2026-08-11T10:15:00', 10),
    (26, 'JAL-2026-000026', N'Reparación de alumbrado público',   @D_Alumbrado,@IdElectrica, 'EN_REVISION','MEDIA', '2026-08-15T13:30:00', 11),
    (27, 'JAL-2026-000027', N'Poste eléctrico en mal estado',     @D_Poste,    @IdElectrica, 'RESUELTA',   'MEDIA', '2026-08-19T09:00:00', 12),
    (28, 'JAL-2026-000028', N'Acumulación de basura',             @D_Basura,   @IdElectrica, 'RESUELTA',   'BAJA',  '2026-08-23T10:25:00', 13),

    (29, 'JAL-2026-000029', N'Árbol que representa riesgo',       @D_Arbol,    @IdAtencion,  'RESUELTA',   'ALTA',  '2026-08-27T11:10:00', 14),
    (30, 'JAL-2026-000030', N'Solicitud de apoyo municipal',      @D_Apoyo,    @IdAtencion,  'RESUELTA',   'MEDIA', '2026-08-31T12:00:00', 15),
    (31, 'JAL-2026-000031', N'Fuga de agua potable',              @D_Fuga,     @IdAtencion,  'RESUELTA',   'MEDIA', '2026-09-03T08:45:00', 1),
    (32, 'JAL-2026-000032', N'Reparación de drenaje',             @D_Drenaje,  @IdAtencion,  'RESUELTA',   'BAJA',  '2026-09-06T09:55:00', 2),
    (33, 'JAL-2026-000033', N'Falta de agua en sector',           @D_FaltaAgua,@IdAtencion,  'RESUELTA',   'ALTA',  '2026-09-09T10:35:00', 3),
    (34, 'JAL-2026-000034', N'Bache en calle principal',          @D_Bache,    @IdAtencion,  'RESUELTA',   'MEDIA', '2026-09-12T11:50:00', 4),
    (35, 'JAL-2026-000035', N'Mantenimiento de calle',            @D_Calle,    @IdAtencion,  'RESUELTA',   'MEDIA', '2026-09-15T14:20:00', 5),

    (36, 'JAL-2026-000036', N'Reparación de alumbrado público',   @D_Alumbrado,@IdDespacho,  'RESUELTA',   'BAJA',  '2026-09-18T09:10:00', 6),
    (37, 'JAL-2026-000037', N'Poste eléctrico en mal estado',     @D_Poste,    @IdDespacho,  'RESUELTA',   'ALTA',  '2026-09-21T10:00:00', 7),
    (38, 'JAL-2026-000038', N'Acumulación de basura',             @D_Basura,   @IdDespacho,  'RESUELTA',   'MEDIA', '2026-09-24T11:30:00', 8),
    (39, 'JAL-2026-000039', N'Árbol que representa riesgo',       @D_Arbol,    @IdDespacho,  'RESUELTA',   'MEDIA', '2026-09-27T13:15:00', 9),
    (40, 'JAL-2026-000040', N'Solicitud de apoyo municipal',      @D_Apoyo,    @IdDespacho,  'RESUELTA',   'BAJA',  '2026-09-30T15:00:00', 10);

    IF (SELECT COUNT(*) FROM @Pets) <> 40
        THROW 50004, 'La definición interna no tiene exactamente 40 peticiones.', 1;

    /*------------------------------------------------------------------
      5) Insertar peticiones + seguimientos
    ------------------------------------------------------------------*/
    DECLARE @N INT = 1;
    DECLARE @SegCreados INT = 0;
    DECLARE @PetCreadas INT = 0;

    WHILE @N <= 40
    BEGIN
        DECLARE @Codigo VARCHAR(25), @Titulo NVARCHAR(200), @Desc NVARCHAR(MAX);
        DECLARE @IdDep INT, @Estado VARCHAR(20), @Prio VARCHAR(10);
        DECLARE @Fec datetime2(0), @OrdC INT, @IdCiu INT, @IdPet BIGINT;
        DECLARE @FecCierre datetime2(0);

        SELECT
            @Codigo = Codigo, @Titulo = Titulo, @Desc = Descripcion,
            @IdDep = IdDepartamento, @Estado = EstadoBD, @Prio = Prioridad,
            @Fec = FechaCreacion, @OrdC = OrdCiudadano
        FROM @Pets WHERE N = @N;

        SELECT @IdCiu = IdCiudadano FROM @MapCiu WHERE Ord = @OrdC;
        IF @IdCiu IS NULL THROW 50005, 'Ciudadano de mapeo no encontrado.', 1;

        SET @FecCierre = CASE WHEN @Estado = 'RESUELTA' THEN DATEADD(DAY, 7, @Fec) ELSE NULL END;

        INSERT INTO dbo.Peticion (
            Codigo, IdCiudadano, IdDepartamento, CreadoPorUsuarioId,
            Titulo, Descripcion, Estado, Prioridad, FechaCreacion, FechaLimite, FechaCierre
        )
        VALUES (
            @Codigo, @IdCiu, @IdDep, @IdCreador,
            @Titulo, @Desc, @Estado, @Prio, @Fec, NULL, @FecCierre
        );

        SET @IdPet = SCOPE_IDENTITY();
        SET @PetCreadas += 1;

        /* Movimiento inicial siempre */
        INSERT INTO dbo.Seguimiento (IdPeticion, IdUsuario, EstadoAnterior, EstadoNuevo, Comentario, FechaMovimiento)
        VALUES (@IdPet, @IdCreador, NULL, 'RECIBIDA', N'Petición creada y recibida en el sistema (dato académico)', @Fec);
        SET @SegCreados += 1;

        IF @Estado = 'EN_PROCESO'
        BEGIN
            INSERT INTO dbo.Seguimiento (IdPeticion, IdUsuario, EstadoAnterior, EstadoNuevo, Comentario, FechaMovimiento)
            VALUES (@IdPet, @IdSeguimientoUser, 'RECIBIDA', 'ASIGNADA', N'Asignada al departamento responsable', DATEADD(DAY, 1, @Fec));
            INSERT INTO dbo.Seguimiento (IdPeticion, IdUsuario, EstadoAnterior, EstadoNuevo, Comentario, FechaMovimiento)
            VALUES (@IdPet, @IdSeguimientoUser, 'ASIGNADA', 'EN_PROCESO', N'Atención técnica en curso', DATEADD(DAY, 2, @Fec));
            SET @SegCreados += 2;
        END
        ELSE IF @Estado = 'EN_REVISION'  -- PENDIENTE del documento
        BEGIN
            INSERT INTO dbo.Seguimiento (IdPeticion, IdUsuario, EstadoAnterior, EstadoNuevo, Comentario, FechaMovimiento)
            VALUES (@IdPet, @IdSeguimientoUser, 'RECIBIDA', 'EN_PROCESO', N'Ingreso a proceso de atención', DATEADD(DAY, 1, @Fec));
            INSERT INTO dbo.Seguimiento (IdPeticion, IdUsuario, EstadoAnterior, EstadoNuevo, Comentario, FechaMovimiento)
            VALUES (@IdPet, @IdSeguimientoUser, 'EN_PROCESO', 'EN_REVISION',
                    N'Pendiente de disponibilidad de material o coordinación. (Estado documental PENDIENTE → EN_REVISION en BD)',
                    DATEADD(DAY, 3, @Fec));
            SET @SegCreados += 2;
        END
        ELSE IF @Estado = 'RESUELTA'
        BEGIN
            INSERT INTO dbo.Seguimiento (IdPeticion, IdUsuario, EstadoAnterior, EstadoNuevo, Comentario, FechaMovimiento)
            VALUES (@IdPet, @IdSeguimientoUser, 'RECIBIDA', 'EN_PROCESO', N'Inspección programada / atención iniciada', DATEADD(DAY, 1, @Fec));
            INSERT INTO dbo.Seguimiento (IdPeticion, IdUsuario, EstadoAnterior, EstadoNuevo, Comentario, FechaMovimiento)
            VALUES (@IdPet, @IdSeguimientoUser, 'EN_PROCESO', 'EN_PROCESO', N'Inspección realizada y trabajo en ejecución', DATEADD(DAY, 4, @Fec));
            INSERT INTO dbo.Seguimiento (IdPeticion, IdUsuario, EstadoAnterior, EstadoNuevo, Comentario, FechaMovimiento)
            VALUES (@IdPet, @IdSeguimientoUser, 'EN_PROCESO', 'RESUELTA', N'Trabajo ejecutado y petición marcada como RESUELTA', DATEADD(DAY, 7, @Fec));
            SET @SegCreados += 3;
        END
        /* RECIBIDA: solo movimiento inicial */

        SET @N += 1;
    END

    /*------------------------------------------------------------------
      6) SecuenciaCodigo → siguiente correlativo coherente (41)
    ------------------------------------------------------------------*/
    IF NOT EXISTS (SELECT 1 FROM dbo.SecuenciaCodigo WHERE Anio = 2026)
    BEGIN
        INSERT INTO dbo.SecuenciaCodigo (Anio, Prefijo, CorrelativoActual, FechaActualizacion)
        VALUES (2026, 'PET', 40, SYSDATETIME());
    END
    ELSE
    BEGIN
        UPDATE dbo.SecuenciaCodigo
        SET CorrelativoActual = 40,
            Prefijo = ISNULL(NULLIF(Prefijo, ''), 'PET'),
            FechaActualizacion = SYSDATETIME()
        WHERE Anio = 2026;
    END

    /*------------------------------------------------------------------
      7) Validaciones finales (si fallan → THROW → ROLLBACK)
    ------------------------------------------------------------------*/
    DECLARE @TotalPet INT = (SELECT COUNT(*) FROM dbo.Peticion);
    DECLARE @CntRecibida INT = (SELECT COUNT(*) FROM dbo.Peticion WHERE Estado = 'RECIBIDA');
    DECLARE @CntProceso INT = (SELECT COUNT(*) FROM dbo.Peticion WHERE Estado = 'EN_PROCESO');
    DECLARE @CntPendienteDoc INT = (SELECT COUNT(*) FROM dbo.Peticion WHERE Estado = 'EN_REVISION'); -- PENDIENTE doc
    DECLARE @CntResuelta INT = (SELECT COUNT(*) FROM dbo.Peticion WHERE Estado = 'RESUELTA');

    DECLARE @CntJalapa INT = (SELECT COUNT(*) FROM dbo.Peticion WHERE IdDepartamento = @IdJalapa);
    DECLARE @CntObras INT = (SELECT COUNT(*) FROM dbo.Peticion WHERE IdDepartamento = @IdObras);
    DECLARE @CntElectrica INT = (SELECT COUNT(*) FROM dbo.Peticion WHERE IdDepartamento = @IdElectrica);
    DECLARE @CntAtencion INT = (SELECT COUNT(*) FROM dbo.Peticion WHERE IdDepartamento = @IdAtencion);
    DECLARE @CntDespacho INT = (SELECT COUNT(*) FROM dbo.Peticion WHERE IdDepartamento = @IdDespacho);

    IF @TotalPet <> 40 THROW 50010, 'Validación: Total peticiones != 40', 1;
    IF @CntRecibida <> 14 THROW 50011, 'Validación: RECIBIDA != 14', 1;
    IF @CntProceso <> 8 THROW 50012, 'Validación: EN_PROCESO != 8', 1;
    IF @CntPendienteDoc <> 4 THROW 50013, 'Validación: EN_REVISION (PENDIENTE doc) != 4', 1;
    IF @CntResuelta <> 14 THROW 50014, 'Validación: RESUELTA != 14', 1;
    IF @CntJalapa <> 10 THROW 50015, 'Validación: JALAPAGUA != 10', 1;
    IF @CntObras <> 10 THROW 50016, 'Validación: OBRAS MUNICIPALES != 10', 1;
    IF @CntElectrica <> 8 THROW 50017, 'Validación: EMPRESA ELECTRICA != 8', 1;
    IF @CntAtencion <> 7 THROW 50018, 'Validación: ATENCIÓN CIUDADANA != 7', 1;
    IF @CntDespacho <> 5 THROW 50019, 'Validación: DESPACHO ALCALDÍA != 5', 1;

    /* Códigos exactos 000001..000040 sin saltos ni duplicados */
    DECLARE @CodOk INT = (
        SELECT COUNT(*) FROM dbo.Peticion p
        WHERE p.Codigo BETWEEN 'JAL-2026-000001' AND 'JAL-2026-000040'
          AND p.Codigo LIKE 'JAL-2026-%'
    );
    DECLARE @DupCod INT = (
        SELECT COUNT(*) FROM (
            SELECT Codigo FROM dbo.Peticion GROUP BY Codigo HAVING COUNT(*) > 1
        ) d
    );
    DECLARE @Esperados INT = (
        SELECT COUNT(*) FROM (
            SELECT RIGHT('000000' + CAST(n AS VARCHAR(6)), 6) AS suf
            FROM (VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),
                         (11),(12),(13),(14),(15),(16),(17),(18),(19),(20),
                         (21),(22),(23),(24),(25),(26),(27),(28),(29),(30),
                         (31),(32),(33),(34),(35),(36),(37),(38),(39),(40)) v(n)
        ) e
        WHERE EXISTS (
            SELECT 1 FROM dbo.Peticion p WHERE p.Codigo = CONCAT('JAL-2026-', e.suf)
        )
    );

    IF @CodOk <> 40 OR @DupCod <> 0 OR @Esperados <> 40
        THROW 50020, 'Validación de códigos JAL-2026-000001..000040 FALLÓ', 1;

    DECLARE @SinCiu INT = (SELECT COUNT(*) FROM dbo.Peticion WHERE IdCiudadano IS NULL);
    DECLARE @SinDep INT = (SELECT COUNT(*) FROM dbo.Peticion WHERE IdDepartamento IS NULL);
    DECLARE @Huerfanos INT = (
        SELECT COUNT(*) FROM dbo.Seguimiento s
        WHERE NOT EXISTS (SELECT 1 FROM dbo.Peticion p WHERE p.IdPeticion = s.IdPeticion)
    );
    DECLARE @InconsistEstado INT = (
        SELECT COUNT(*)
        FROM dbo.Peticion p
        CROSS APPLY (
            SELECT TOP (1) s.EstadoNuevo
            FROM dbo.Seguimiento s
            WHERE s.IdPeticion = p.IdPeticion
            ORDER BY s.FechaMovimiento DESC, s.IdSeguimiento DESC
        ) u
        WHERE u.EstadoNuevo <> p.Estado
    );

    IF @SinCiu <> 0 THROW 50021, 'Hay peticiones sin ciudadano', 1;
    IF @SinDep <> 0 THROW 50022, 'Hay peticiones sin departamento', 1;
    IF @Huerfanos <> 0 THROW 50023, 'Hay seguimientos huérfanos', 1;
    IF @InconsistEstado <> 0 THROW 50024, 'Estado Peticion != último Seguimiento', 1;

    /* Resumen imprimible */
    PRINT '========== RESUMEN RESET DEMO TESIS ==========';
    PRINT CONCAT('Peticiones eliminadas (antes): ', @ElimPet);
    PRINT CONCAT('Seguimientos eliminados (antes): ', @ElimSeg);
    PRINT CONCAT('Ciudadanos demo presentes (DPI 9100...): ', @CiuCreados);
    PRINT CONCAT('Peticiones creadas: ', @PetCreadas);
    PRINT CONCAT('Seguimientos creados: ', @SegCreados);
    PRINT CONCAT('RECIBIDA: ', @CntRecibida);
    PRINT CONCAT('EN_PROCESO: ', @CntProceso);
    PRINT CONCAT('EN_REVISION (PENDIENTE en documento): ', @CntPendienteDoc);
    PRINT CONCAT('RESUELTA: ', @CntResuelta);
    PRINT 'Validación de códigos: OK';
    PRINT 'Validación de FK/consistencia: OK';
    PRINT 'SecuenciaCodigo 2026 CorrelativoActual=40 (siguiente=000041)';
    PRINT '==============================================';

    /* Consultas de comprobación solicitadas */
    SELECT COUNT(*) AS TotalPeticiones FROM dbo.Peticion;
    SELECT Estado, COUNT(*) AS Total FROM dbo.Peticion GROUP BY Estado ORDER BY Estado;
    SELECT d.Nombre AS Departamento, COUNT(*) AS Total
    FROM dbo.Peticion p
    INNER JOIN dbo.Departamento d ON d.IdDepartamento = p.IdDepartamento
    GROUP BY d.Nombre
    ORDER BY Total DESC;
    SELECT Codigo FROM dbo.Peticion ORDER BY Codigo;
    SELECT CorrelativoActual FROM dbo.SecuenciaCodigo WHERE Anio = 2026;

    COMMIT TRANSACTION;
    PRINT 'COMMIT OK — datos demo listos para demostración.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    PRINT 'ROLLBACK — no se aplicaron cambios.';
    PRINT CONCAT('Error ', ERROR_NUMBER(), ': ', ERROR_MESSAGE());
    THROW;
END CATCH;
GO
