# Publicar una prueba en Railway

El código ya soporta dos modos:

- **Tu PC:** Windows + SQL Express (como siempre).
- **Railway:** usuario y contraseña SQL + el sitio web en la misma URL.

No subas DPI reales. Usa datos de prueba.

## 1. Cuenta

1. Entra a https://railway.com y crea cuenta (GitHub es lo más fácil).
2. Activa el trial (crédito de unos US$5 por 30 días).

## 2. Exportar la base desde tu PC

En SSMS, sobre `MuniPeticionesJalapa`:

1. Clic derecho → **Tasks** → **Generate Scripts**.
2. Todas las tablas.
3. Advanced: **Types of data to script** = **Schema and data**.
4. Guarda un `.sql`.

## 3. Proyecto en Railway

1. **New project**.
2. **Add service** → **Database** → busca **SQL Server** (plantilla Docker de Microsoft).
   - Variable `ACCEPT_EULA=Y`
   - `MSSQL_SA_PASSWORD` = una clave fuerte (mayúscula, minúscula, número; mínimo 8).
   - `MSSQL_PID=Express`
3. Espera a que el contenedor esté **Online**.
4. En ese servicio, anota:
   - host privado (algo como `sqlserver.railway.internal`) o el TCP público
   - puerto `1433` (o el que muestre Railway)
   - usuario `sa`
   - la contraseña que pusiste

5. Crea la base. Conéctate con Azure Data Studio / SSMS al TCP público y ejecuta:

```sql
CREATE DATABASE MuniPeticionesJalapa;
```

Luego corre el script que exportaste (paso 2).

## 4. Subir la aplicación

1. En el mismo proyecto Railway: **New service** → **GitHub repo** (sube `PG_Muni` a GitHub)  
   o **Empty service** y despliega con Railway CLI.
2. **Root directory:** la carpeta `PG_Muni` (donde está el `Dockerfile`).
3. Builder: **Dockerfile** (ya está `railway.toml`).

Variables del servicio **web** (Variables):

```
NODE_ENV=production
JWT_SECRET=una_clave_larga_nueva
JWT_EXPIRES_IN=8h
DB_USER=sa
DB_PASSWORD=la_misma_del_sql
DB_SERVER=sqlserver.railway.internal
DB_PORT=1433
DB_DATABASE=MuniPeticionesJalapa
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
```

Si la app no alcanza el host interno, usa el **TCP Proxy** público del SQL Server como `DB_SERVER` y su puerto público como `DB_PORT`.

4. **Settings → Networking → Generate domain**. Queda algo como  
   `https://peticiones-xxxx.up.railway.app`

## 5. Probar

Abre esa URL en el celular. Login de prueba (`admin` / `admin123` si los exportaste).

`/health` debe responder `OK`.

## Qué hice yo en el código

- Conexión SQL con usuario/clave (nube) o Windows (tu PC).
- `msnodesqlv8` es opcional (solo Windows).
- En producción el backend sirve el frontend compilado (una sola URL).
- Axios usa la misma URL si no hay `VITE_API_URL`.

## Qué tienes que hacer tú

Railway pide tu cuenta y tu tarjeta/trial. Yo no puedo crear el proyecto ni importar tu BD desde aquí.

Cuando tengas el `.sql` exportado y la cuenta, dime y te ayudo a revisar variables o errores del deploy.
