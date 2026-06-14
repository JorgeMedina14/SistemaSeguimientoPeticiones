const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dbRoutes = require('./routes/dbRoutes');
const authRoutes = require('./routes/auth.routes');
const testRoutes = require('./routes/test.routes');
const peticionesRoutes = require('./routes/peticiones.routes');
const reportesRoutes = require('./routes/reportes.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const departamentosRoutes = require('./routes/departamentos.routes');
const { setupSwagger } = require('./config/swagger.setup');

const app = express();

setupSwagger(app);

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/db', dbRoutes);
app.use('/auth', authRoutes);
app.use('/test', testRoutes);
app.use('/peticiones', peticionesRoutes);
app.use('/reportes', reportesRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/departamentos', departamentosRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Backend Muni Peticiones Jalapa'
  });
});

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
