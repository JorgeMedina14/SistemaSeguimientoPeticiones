require('dotenv').config();
const app = require('./app');
const { closePool } = require('./db/pool');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('Sistema de Peticiones Ciudadanas - Backend');
  console.log('='.repeat(50));
  console.log(`Servidor corriendo en puerto: ${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
  console.log('='.repeat(50));
});

const shutdown = async (label) => {
  console.log(label);
  await closePool();
  server.close(() => {
    console.log('Servidor cerrado correctamente');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM recibido. Cerrando servidor...'));
process.on('SIGINT', () => shutdown('\nSIGINT recibido. Cerrando servidor...'));
