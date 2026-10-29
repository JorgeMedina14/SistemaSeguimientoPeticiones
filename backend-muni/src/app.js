const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dbRoutes = require('./routes/dbRoutes');
const authRoutes = require('./routes/auth.routes');
const peticionesRoutes = require('./routes/peticiones.routes');
const reportesRoutes = require('./routes/reportes.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const departamentosRoutes = require('./routes/departamentos.routes');
const { setupSwagger } = require('./config/swagger.setup');

const app = express();

setupSwagger(app);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Evitar 304 en endpoints JSON (rompe el fetch del frontend)
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.use('/db', dbRoutes);
app.use('/auth', authRoutes);
app.use('/peticiones', peticionesRoutes);
app.use('/reportes', reportesRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/departamentos', departamentosRoutes);

// Rutas de prueba de roles solo en desarrollo
if (process.env.NODE_ENV === 'development') {
  const testRoutes = require('./routes/test.routes');
  app.use('/test', testRoutes);
}

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Backend Muni Peticiones Jalapa'
  });
});

const frontendDist = process.env.FRONTEND_DIST
  || path.join(__dirname, '../../frontend-react/dist');
const serveFrontend = fs.existsSync(path.join(frontendDist, 'index.html'));

const isApiPath = (urlPath) =>
  /^\/(auth|peticiones|reportes|usuarios|departamentos|db|health|api-docs|test)(\/|$)/.test(urlPath);

if (!serveFrontend) {
  app.get('/', (req, res) => {
    res.status(200).json({
      message: 'API Sistema de Peticiones Ciudadanas',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        swagger: '/api-docs',
        openApi: '/api-docs.json'
      }
    });
  });
} else {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (isApiPath(req.path) || req.method !== 'GET') {
      return next();
    }
    return res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;
