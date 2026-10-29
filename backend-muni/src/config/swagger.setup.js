const swaggerUi = require('swagger-ui-express');
const { openapiSpec } = require('../docs/openapi');

const SWAGGER_UI_PATH = '/api-docs';
const SWAGGER_JSON_PATH = '/api-docs.json';

/**
 * Monta Swagger UI y la spec JSON. No altera rutas ni middlewares existentes.
 * Se registra antes de helmet() para evitar conflictos de CSP con la UI.
 */
function setupSwagger(app) {
  app.get(SWAGGER_JSON_PATH, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(openapiSpec);
  });

  app.use(
    SWAGGER_UI_PATH,
    swaggerUi.serve,
    swaggerUi.setup(openapiSpec, {
      customSiteTitle: 'API Peticiones Ciudadanas - Swagger',
      swaggerOptions: {
        persistAuthorization: true
      }
    })
  );
}

module.exports = { setupSwagger };
