/**
 * Especificación OpenAPI 3.0 — solo documentación.
 * No interviene en rutas, middlewares ni lógica de negocio.
 */
const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'API Sistema de Peticiones Ciudadanas',
    description:
      'Municipalidad de Jalapa — Registro y seguimiento de peticiones ciudadanas. ' +
      'Para rutas protegidas use **Authorize** con el JWT obtenido en `POST /auth/login`.',
    version: '1.0.0',
    contact: {
      name: 'PG_Muni - Backend'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Servidor local'
    }
  ],
  tags: [
    { name: 'Sistema', description: 'Health y utilidades' },
    { name: 'Auth', description: 'Autenticación JWT' },
    { name: 'Peticiones', description: 'Gestión de peticiones' },
    { name: 'Departamentos', description: 'Catálogo de departamentos' },
    { name: 'Reportes', description: 'Panel ejecutivo y reportes (ADMIN, ALCALDE)' },
    { name: 'Usuarios', description: 'Administración de usuarios (solo ADMIN)' },
    { name: 'Test', description: 'Pruebas de roles (desarrollo)' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token devuelto en POST /auth/login (campo data.token)'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', example: 'admin' },
          password: { type: 'string', example: 'admin123' }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Login exitoso' },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              user: { $ref: '#/components/schemas/UserProfile' }
            }
          }
        }
      },
      UserProfile: {
        type: 'object',
        properties: {
          idUsuario: { type: 'integer' },
          username: { type: 'string' },
          nombreCompleto: { type: 'string' },
          rol: {
            type: 'string',
            enum: ['ADMIN', 'ALCALDE', 'JEFE_DEPTO', 'RECEPCION']
          },
          idDepartamento: { type: 'integer', nullable: true }
        }
      },
      CiudadanoInput: {
        type: 'object',
        required: ['dpi', 'nombres', 'apellidos'],
        properties: {
          dpi: { type: 'string', description: '13 dígitos numéricos', example: '1234567890101' },
          nombres: { type: 'string', example: 'Juan' },
          apellidos: { type: 'string', example: 'Perez' },
          telefono: { type: 'string', example: '55551234' },
          correo: { type: 'string', format: 'email' },
          direccion: { type: 'string' }
        }
      },
      PeticionInput: {
        type: 'object',
        required: ['titulo', 'descripcion'],
        properties: {
          titulo: { type: 'string', example: 'Necesidad de camino' },
          descripcion: { type: 'string' },
          prioridad: { type: 'string', enum: ['BAJA', 'MEDIA', 'ALTA'], example: 'ALTA' }
        }
      },
      CrearPeticionRequest: {
        type: 'object',
        required: ['ciudadano', 'peticion', 'idDepartamento'],
        properties: {
          ciudadano: { $ref: '#/components/schemas/CiudadanoInput' },
          peticion: { $ref: '#/components/schemas/PeticionInput' },
          idDepartamento: { type: 'integer', example: 3 }
        }
      },
      CambiarEstadoRequest: {
        type: 'object',
        required: ['estadoNuevo'],
        properties: {
          estadoNuevo: {
            type: 'string',
            enum: [
              'RECIBIDA',
              'EN_REVISION',
              'ASIGNADA',
              'EN_PROCESO',
              'RESUELTA',
              'RECHAZADA',
              'CERRADA'
            ],
            example: 'RESUELTA'
          },
          comentario: { type: 'string', example: 'Caso atendido' }
        }
      },
      CrearUsuarioRequest: {
        type: 'object',
        required: ['username', 'password', 'nombreCompleto', 'rol'],
        properties: {
          username: { type: 'string' },
          password: { type: 'string' },
          nombreCompleto: { type: 'string' },
          rol: {
            type: 'string',
            enum: ['ADMIN', 'ALCALDE', 'JEFE_DEPTO', 'RECEPCION']
          },
          idDepartamento: {
            type: 'integer',
            description: 'Requerido si rol es JEFE_DEPTO'
          }
        }
      },
      ActualizarUsuarioRequest: {
        type: 'object',
        properties: {
          nombreCompleto: { type: 'string' },
          rol: { type: 'string', enum: ['ADMIN', 'ALCALDE', 'JEFE_DEPTO', 'RECEPCION'] },
          idDepartamento: { type: 'integer' }
        }
      },
      ActivoRequest: {
        type: 'object',
        required: ['activo'],
        properties: {
          activo: { type: 'boolean' }
        }
      },
      PasswordRequest: {
        type: 'object',
        required: ['nuevaPassword'],
        properties: {
          nuevaPassword: { type: 'string' }
        }
      }
    },
    parameters: {
      fechaInicio: {
        name: 'fechaInicio',
        in: 'query',
        schema: { type: 'string', format: 'date' },
        example: '2026-01-01'
      },
      fechaFin: {
        name: 'fechaFin',
        in: 'query',
        schema: { type: 'string', format: 'date' },
        example: '2026-12-31'
      },
      page: {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', default: 1 }
      },
      limit: {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', default: 10 }
      },
      idPath: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'integer' }
      }
    }
  },
  paths: {
    '/': {
      get: {
        tags: ['Sistema'],
        summary: 'Información de la API',
        responses: {
          200: { description: 'Metadatos básicos de la API' }
        }
      }
    },
    '/health': {
      get: {
        tags: ['Sistema'],
        summary: 'Health check',
        responses: {
          200: {
            description: 'Servicio en línea',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'OK' },
                    timestamp: { type: 'string', format: 'date-time' },
                    service: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/db/ping': {
      get: {
        tags: ['Sistema'],
        summary: 'Ping base de datos',
        description: 'Verifica conexión a SQL Server',
        responses: {
          200: { description: 'Conexión OK' },
          500: { description: 'Error de conexión' }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Iniciar sesión',
        description: 'Devuelve JWT en data.token (válido ~8h por defecto)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Login exitoso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' }
              }
            }
          },
          401: { description: 'Credenciales inválidas' }
        }
      }
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Perfil del usuario autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Perfil del usuario' },
          401: { description: 'No autenticado' }
        }
      }
    },
    '/peticiones': {
      get: {
        tags: ['Peticiones'],
        summary: 'Listar peticiones',
        description: 'Roles: ADMIN, ALCALDE, JEFE_DEPTO, RECEPCION',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/limit' },
          {
            name: 'estado',
            in: 'query',
            schema: {
              type: 'string',
              enum: [
                'RECIBIDA',
                'EN_REVISION',
                'ASIGNADA',
                'EN_PROCESO',
                'RESUELTA',
                'RECHAZADA',
                'CERRADA'
              ]
            }
          },
          {
            name: 'prioridad',
            in: 'query',
            schema: { type: 'string', enum: ['BAJA', 'MEDIA', 'ALTA'] }
          },
          { name: 'departamento', in: 'query', schema: { type: 'integer' } },
          { $ref: '#/components/parameters/fechaInicio' },
          { $ref: '#/components/parameters/fechaFin' },
          { name: 'q', in: 'query', schema: { type: 'string', description: 'Búsqueda por código' } }
        ],
        responses: {
          200: { description: 'Listado paginado' },
          401: { description: 'No autenticado' },
          403: { description: 'Sin permiso' }
        }
      },
      post: {
        tags: ['Peticiones'],
        summary: 'Crear petición',
        description: 'Roles: RECEPCION, ALCALDE',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CrearPeticionRequest' }
            }
          }
        },
        responses: {
          201: { description: 'Peticion creada' },
          400: { description: 'Validación fallida' },
          401: { description: 'No autenticado' },
          403: { description: 'Sin permiso' }
        }
      }
    },
    '/peticiones/{id}': {
      get: {
        tags: ['Peticiones'],
        summary: 'Detalle de petición',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/idPath' }],
        responses: {
          200: { description: 'Detalle' },
          404: { description: 'No encontrada' }
        }
      },
      delete: {
        tags: ['Peticiones'],
        summary: 'Eliminar petición',
        description: 'Roles: ADMIN, ALCALDE',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/idPath' }],
        responses: {
          200: { description: 'Eliminada' },
          403: { description: 'Sin permiso' },
          404: { description: 'No encontrada' }
        }
      }
    },
    '/peticiones/{id}/estado': {
      put: {
        tags: ['Peticiones'],
        summary: 'Cambiar estado',
        description: 'Roles: ADMIN, ALCALDE, JEFE_DEPTO',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/idPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CambiarEstadoRequest' }
            }
          }
        },
        responses: {
          200: { description: 'Estado actualizado' },
          400: { description: 'Estado inválido' },
          404: { description: 'No encontrada' }
        }
      }
    },
    '/departamentos': {
      get: {
        tags: ['Departamentos'],
        summary: 'Listar departamentos',
        description: 'Roles: ADMIN, RECEPCION, ALCALDE',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Listado de departamentos' }
        }
      }
    },
    '/reportes/dashboard': {
      get: {
        tags: ['Reportes'],
        summary: 'Dashboard ejecutivo',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/fechaInicio' },
          { $ref: '#/components/parameters/fechaFin' }
        ],
        responses: { 200: { description: 'Panel completo' } }
      }
    },
    '/reportes/resumen': {
      get: {
        tags: ['Reportes'],
        summary: 'Resumen general',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/fechaInicio' },
          { $ref: '#/components/parameters/fechaFin' }
        ],
        responses: { 200: { description: 'Resumen' } }
      }
    },
    '/reportes/por-departamento': {
      get: {
        tags: ['Reportes'],
        summary: 'Reporte por departamento',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/fechaInicio' },
          { $ref: '#/components/parameters/fechaFin' }
        ],
        responses: { 200: { description: 'Datos por departamento' } }
      }
    },
    '/reportes/tiempos': {
      get: {
        tags: ['Reportes'],
        summary: 'Tiempos promedio de resolución',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/fechaInicio' },
          { $ref: '#/components/parameters/fechaFin' }
        ],
        responses: { 200: { description: 'Tiempos' } }
      }
    },
    '/reportes/ciudadanos-frecuentes': {
      get: {
        tags: ['Reportes'],
        summary: 'Ciudadanos frecuentes',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/limit' },
          { name: 'top', in: 'query', schema: { type: 'integer' } },
          { $ref: '#/components/parameters/fechaInicio' },
          { $ref: '#/components/parameters/fechaFin' },
          { name: 'estado', in: 'query', schema: { type: 'string' } },
          { name: 'q', in: 'query', schema: { type: 'string' } }
        ],
        responses: { 200: { description: 'Listado' } }
      }
    },
    '/usuarios': {
      get: {
        tags: ['Usuarios'],
        summary: 'Listar usuarios',
        description: 'Solo ADMIN',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/limit' },
          {
            name: 'rol',
            in: 'query',
            schema: { type: 'string', enum: ['ADMIN', 'ALCALDE', 'JEFE_DEPTO', 'RECEPCION'] }
          },
          { name: 'activo', in: 'query', schema: { type: 'boolean' } },
          { name: 'departamento', in: 'query', schema: { type: 'integer' } }
        ],
        responses: { 200: { description: 'Listado' } }
      },
      post: {
        tags: ['Usuarios'],
        summary: 'Crear usuario',
        description: 'Solo ADMIN',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CrearUsuarioRequest' }
            }
          }
        },
        responses: {
          201: { description: 'Usuario creado' },
          400: { description: 'Validación fallida' }
        }
      }
    },
    '/usuarios/{id}': {
      get: {
        tags: ['Usuarios'],
        summary: 'Obtener usuario por ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/idPath' }],
        responses: {
          200: { description: 'Usuario' },
          404: { description: 'No encontrado' }
        }
      },
      put: {
        tags: ['Usuarios'],
        summary: 'Actualizar usuario',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/idPath' }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ActualizarUsuarioRequest' }
            }
          }
        },
        responses: { 200: { description: 'Actualizado' } }
      },
      delete: {
        tags: ['Usuarios'],
        summary: 'Eliminar usuario',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/idPath' }],
        responses: { 200: { description: 'Eliminado' } }
      }
    },
    '/usuarios/{id}/activo': {
      patch: {
        tags: ['Usuarios'],
        summary: 'Activar o desactivar usuario',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/idPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ActivoRequest' }
            }
          }
        },
        responses: { 200: { description: 'Estado actualizado' } }
      }
    },
    '/usuarios/{id}/password': {
      patch: {
        tags: ['Usuarios'],
        summary: 'Cambiar contraseña',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/idPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PasswordRequest' }
            }
          }
        },
        responses: { 200: { description: 'Contraseña actualizada' } }
      }
    },
    '/test/admin': {
      get: {
        tags: ['Test'],
        summary: 'Prueba rol ADMIN',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Acceso permitido' }, 403: { description: 'Prohibido' } }
      }
    },
    '/test/alcalde': {
      get: {
        tags: ['Test'],
        summary: 'Prueba rol ALCALDE',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Acceso permitido' } }
      }
    },
    '/test/recepcion': {
      get: {
        tags: ['Test'],
        summary: 'Prueba rol RECEPCION',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Acceso permitido' } }
      }
    },
    '/test/jefe': {
      get: {
        tags: ['Test'],
        summary: 'Prueba rol JEFE_DEPTO',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Acceso permitido' } }
      }
    },
    '/test/admin-alcalde': {
      get: {
        tags: ['Test'],
        summary: 'Prueba roles ADMIN o ALCALDE',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Acceso permitido' } }
      }
    }
  }
};

module.exports = { openapiSpec };
