# Sistema Web para el Registro, Control y Seguimiento de Peticiones Ciudadanas

Proyecto académico orientado a una municipalidad. Permite registrar peticiones ciudadanas, asignarlas a departamentos, controlar estados, registrar seguimientos, administrar usuarios/roles y consultar indicadores en un dashboard ejecutivo.

## Objetivo

Facilitar el control institucional de las peticiones ciudadanas, con trazabilidad de cambios de estado y apoyo a la toma de decisiones mediante indicadores.

## Tecnologías

| Capa | Tecnología |
|------|------------|
| Frontend | **React + Vite + React Router + Axios** (`frontend-react`) |
| Backend | Node.js + Express |
| Base de datos | Microsoft SQL Server |
| Arquitectura | Cliente–servidor (SPA React ↔ API REST) |

## Módulos principales

1. **Autenticación** — login con JWT.
2. **Dashboard** — métricas, reportes y actividad reciente (ADMIN / ALCALDE).
3. **Peticiones** — listado, filtros, detalle, cambio de estado y seguimientos.
4. **Nueva petición** — registro de ciudadano + petición (RECEPCION / ALCALDE).
5. **Usuarios** — CRUD, activar/desactivar y cambio de contraseña (ADMIN).

> **Nota:** Reportes quedó unificado dentro del **Dashboard** para evitar duplicar la misma información.

## Roles del sistema

| Rol | Capacidades principales |
|-----|-------------------------|
| `ADMIN` | Usuarios, peticiones, dashboard |
| `ALCALDE` | Dashboard, peticiones, puede registrar peticiones |
| `RECEPCION` | Registrar y consultar peticiones |
| `JEFE_DEPTO` | Ver y dar seguimiento a peticiones de su departamento |

## Entidades principales (modelo real)

La base de datos `MuniPeticionesJalapa` usa **6 tablas**:

- `Ciudadano`
- `Departamento`
- `Usuario` (campo `Rol` con CHECK)
- `Peticion` (campo `Estado` con CHECK)
- `Seguimiento`
- `SecuenciaCodigo`

**Diseño defendible:** en lugar de tablas catálogo `Rol` y `EstadoPeticion`, el sistema usa restricciones `CHECK` sobre columnas `varchar`. Esto mantiene integridad de valores permitidos con un esquema más simple y adecuado al alcance del proyecto.

Estados de petición: `RECIBIDA`, `EN_REVISION`, `ASIGNADA`, `EN_PROCESO`, `RESUELTA`, `RECHAZADA`, `CERRADA`.

Definición operativa en dashboard:

- **Resueltas** = `RESUELTA` + `CERRADA`
- **Pendientes** = el resto de estados

## Estructura del proyecto

```
PG_Muni/
├── DATABASE.md
├── POSTMAN_GUIA.txt
├── README.md
├── backend-muni/
│   └── src/
│       ├── config/          # Conexión SQL Server
│       ├── controllers/
│       ├── services/
│       ├── repositories/    # Consultas SQL
│       ├── routes/
│       ├── middlewares/
│       ├── db/              # Pool de conexiones
│       ├── app.js
│       └── server.js
└── frontend-react/
    ├── public/              # logo, favicon
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── context/
    │   ├── pages/
    │   ├── routes/
    │   ├── styles/
    │   ├── utils/
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    └── vite.config.js
```

## Requisitos

- Node.js
- SQL Server (por defecto `localhost\SQLEXPRESS`)
- ODBC Driver 17 for SQL Server
- Base de datos `MuniPeticionesJalapa` importada (ver `DATABASE.md`)

## Configuración de base de datos

1. Crear/importar la BD según `DATABASE.md`.
2. Revisar `backend-muni/.env`:

```env
PORT=5000
NODE_ENV=development
DB_SERVER=localhost\SQLEXPRESS
DB_DATABASE=MuniPeticionesJalapa
DB_TRUSTED_CONNECTION=true
JWT_SECRET=su_clave_secreta_jwt
JWT_EXPIRES_IN=8h
```

3. Verificar conexión (con token de admin): `GET http://localhost:5000/db/ping`

## Instalar y ejecutar

### Backend

```powershell
cd PG_Muni\backend-muni
npm.cmd install
npm.cmd start
```

API: http://localhost:5000  
Swagger: http://localhost:5000/api-docs

### Frontend React

```powershell
cd PG_Muni\frontend-react
npm.cmd install
npm.cmd run dev
```

UI: http://localhost:5173

> En PowerShell, si `npm` falla por política de ejecución, use `npm.cmd`.

### Prueba en internet (Railway)

Guía paso a paso: `RAILWAY.md`. En tu PC no cambia nada: si no hay `DB_USER`/`DB_PASSWORD`, sigue usando SQL Express con Windows.

## Cómo funciona el dashboard

El dashboard consume datos reales de la API (`/reportes/dashboard` y endpoints relacionados).

Muestra:

- Total de peticiones
- % resueltas
- % pendientes
- Promedio de días de resolución
- Cambio % de resueltas vs periodo anterior
- Peticiones por estado y por departamento
- Ciudadanos frecuentes
- Últimos movimientos (seguimientos)
- Tiempos de resolución (mín / máx / promedio)

## Fórmulas de porcentajes

```text
% Resueltas  = (resueltas / total) * 100
% Pendientes = (pendientes / total) * 100
```

Reglas:

- Si `total = 0` → se muestra `0.0%` (sin división entre cero).
- Los porcentajes se redondean a **1 decimal**.
- Resueltas = estados `RESUELTA` y `CERRADA`.
- Pendientes = total − resueltas.

Promedio de días:

```text
Promedio = suma(días entre creación y cierre) / cantidad de peticiones resueltas/cerradas con fecha de cierre
```

Cambio porcentual de resueltas:

```text
delta = %Resueltas(periodo actual) − %Resueltas(periodo anterior)
```

Si no hay datos anteriores suficientes, se muestra `-`.

## Credenciales de prueba

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `admin123` | ADMIN |
| `alcalde` | `alcalde123` | ALCALDE |
| `recepcion` | `recepcion123` | RECEPCION |
| `jefe_obras` | `jefe123` | JEFE_DEPTO |
| `jefe_jalapagua` | `jefe123` | JEFE_DEPTO |
| `jefe_electrica` | `jefe123` | JEFE_DEPTO |

Para (re)crear jefes:

```powershell
cd PG_Muni\backend-muni
npm.cmd run seed:jefes
```

## Pruebas manuales recomendadas

1. Iniciar sesión con cada rol.
2. Ver dashboard (admin/alcalde) y validar porcentajes.
3. Registrar una petición.
4. Buscar y filtrar por estado/prioridad.
5. Ver detalle, cambiar estado y agregar seguimiento.
6. Crear/editar usuario, activar/desactivar, cambiar contraseña.
7. Confirmar que jefe de departamento solo ve su área.

## Documentación adicional

- `DATABASE.md` — modelo de datos y conexión.
- `POSTMAN_GUIA.txt` — pruebas de API.
- Swagger UI — contrato de endpoints en `/api-docs`.
