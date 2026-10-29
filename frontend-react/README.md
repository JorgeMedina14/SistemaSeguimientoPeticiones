# Frontend React — Sistema de Peticiones Ciudadanas

Cliente web del sistema municipal, construido con **React + Vite**.

Consume la API de `backend-muni` (**sin modificar** endpoints ni base de datos).

## Tecnologías

- React 19
- Vite
- React Router DOM
- Axios
- Lucide React (iconos)
- CSS institucional propio (variables + componentes)

## Cómo ejecutar

Requisitos: backend corriendo en `http://localhost:5000`.

```powershell
cd PG_Muni\frontend-react
npm.cmd install
npm.cmd run dev
```

Abrir: http://localhost:5173

Variables (`.env`):

```env
VITE_API_URL=http://localhost:5000
```

## Estructura

```
src/
  api/           # Axios + módulos por dominio
  components/    # layout, ui, dashboard
  context/       # AuthContext (JWT)
  pages/         # Login, Dashboard, Peticiones, Usuarios...
  routes/        # ProtectedRoute / RoleRoute
  styles/        # variables, layout, login, components
  utils/         # roles, formatters
public/
  logo-muni.png
  favicon.svg
```

## Módulos

| Ruta | Roles |
|------|-------|
| `/login` | público |
| `/dashboard` | ADMIN, ALCALDE |
| `/peticiones` | todos autenticados |
| `/peticiones/nueva` | RECEPCION, ALCALDE |
| `/peticiones/:id` | autenticados |
| `/usuarios` | ADMIN |

> `/reportes` redirige al Dashboard (reportes unificados).

## Credenciales de prueba

Ver `../README.md` o `../POSTMAN_GUIA.txt` (`admin/admin123`, etc.).
