import path from 'path';
import { fileURLToPath } from 'url';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Resolve route files from this file's folder, so the docs work no matter
// which directory the server is started from.
const rootDir = path.dirname(fileURLToPath(import.meta.url));

const buildSpec = () => {
  const port = process.env.PORT || 5001;

  return swaggerJSDoc({
    definition: {
      openapi: '3.0.3',
      info: {
        title: 'Exercise Logger API',
        version: '1.0.0',
        description: [
          'REST API for the Exercise Logger website.',
          '',
          '**How authentication works**',
          '1. Call `POST /api/auth/register` or `POST /api/auth/login`.',
          '2. Copy the `token` from the response.',
          '3. Click **Authorize** (top right) and paste the token.',
          '',
          'Every `/api/routines` and `/api/history` request then sends it as `Authorization: Bearer <token>`.',
          'Login and register also set an httpOnly `jwt` cookie, but the protected routes read the token from the `Authorization` header only.',
          '',
          '**Errors** are returned as `{ "error": "message" }`.',
        ].join('\n'),
      },
      servers: [
        {
          url: `http://localhost:${port}`,
          description: 'Development server',
        },
        {
          url: process.env.API_URL || 'https://your-backend-production-url.onrender.com',
          description: 'Production server',
        },
      ],
      tags: [
        { name: 'Auth', description: 'Create an account, log in and log out' },
        { name: 'Routines', description: 'The signed-in user\'s workout routines (read and replace the whole list)' },
        { name: 'History', description: 'Finished workouts saved by the signed-in user' },
        { name: 'Health', description: 'Server and database status' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT returned by `/api/auth/login` or `/api/auth/register`. Paste only the token, without the word "Bearer".',
          },
        },
        schemas: {
          Error: {
            type: 'object',
            description: 'Shape of every error response.',
            properties: {
              error: { type: 'string', example: 'Please log in' },
            },
            required: ['error'],
          },
          User: {
            type: 'object',
            description: 'Public user data (the password hash is never returned).',
            properties: {
              id: { type: 'string', example: 'cm3x9k2ab0000qz8h1f2g3h4j' },
              email: { type: 'string', format: 'email', example: 'test@athala.dev' },
              name: { type: 'string', example: 'Abo Athala' },
            },
          },
          RegisterRequest: {
            type: 'object',
            required: ['name', 'email', 'password'],
            properties: {
              name: { type: 'string', description: 'Display name. Surrounding spaces are trimmed.', example: 'Abo Athala' },
              email: { type: 'string', format: 'email', description: 'Trimmed and stored in lowercase. Must be unique.', example: 'new.user@example.com' },
              password: { type: 'string', format: 'password', minLength: 8, maxLength: 72, description: '8 to 72 characters.', example: 'supersecret123' },
            },
          },
          LoginRequest: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: { type: 'string', format: 'email', description: 'Case-insensitive.', example: 'test@athala.dev' },
              password: { type: 'string', format: 'password', example: 'test' },
            },
          },
          AuthResponse: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                description: 'JWT to send as `Authorization: Bearer <token>`. Valid for `JWT_EXPIRES_IN` (default 7 days).',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
              user: { $ref: '#/components/schemas/User' },
            },
          },
          LogoutResponse: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'success' },
              message: { type: 'string', example: 'Logged out' },
            },
          },
          RoutineSet: {
            type: 'object',
            description: 'One planned set of an exercise.',
            properties: {
              id: { type: 'integer', example: 1 },
              weight: { type: 'number', description: 'Weight in kg', example: 80 },
              reps: { type: 'integer', example: 8 },
              timeSec: { type: 'integer', description: 'Duration for timed exercises', example: 0 },
              done: { type: 'boolean', example: false },
            },
          },
          RoutineExercise: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'ex-bench-press' },
              name: { type: 'string', example: 'Bench Press' },
              mode: { type: 'string', description: 'How the exercise is tracked, e.g. `weight` or time-based', example: 'weight' },
              restTimeSec: { type: 'integer', example: 120 },
              sets: { type: 'array', items: { $ref: '#/components/schemas/RoutineSet' } },
            },
          },
          RoutineWorkout: {
            type: 'object',
            description: 'One workout day inside a routine (e.g. Push, Pull, Legs).',
            properties: {
              id: { type: 'string', example: 'w-push' },
              name: { type: 'string', example: 'Push' },
              targetMuscles: { type: 'array', items: { type: 'string' }, example: ['Chest', 'Shoulders', 'Triceps'] },
              exercises: { type: 'array', items: { $ref: '#/components/schemas/RoutineExercise' } },
            },
          },
          Routine: {
            type: 'object',
            description: 'A routine exactly as the Routines page stores it. The server saves it as-is (JSON), so extra fields are kept.',
            additionalProperties: true,
            properties: {
              id: { type: 'string', example: 'routine-1' },
              name: { type: 'string', example: 'Routine 1 PPL' },
              isTemplate: { type: 'boolean', example: true },
              workouts: { type: 'array', items: { $ref: '#/components/schemas/RoutineWorkout' } },
            },
          },
          WorkoutSet: {
            type: 'object',
            description: 'One performed set.',
            properties: {
              setNum: { type: 'integer', example: 1 },
              reps: { type: 'integer', example: 8 },
              weightKg: { type: 'number', example: 100 },
              timeSec: { type: 'integer', example: 0 },
              completed: { type: 'boolean', example: true },
              restTimerSec: { type: 'integer', example: 120 },
            },
          },
          WorkoutExercise: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'ex-squat' },
              name: { type: 'string', example: 'Barbell Squat' },
              category: { type: 'string', example: 'Legs' },
              description: { type: 'string' },
              videoUrl: { type: 'string', format: 'uri' },
              mode: { type: 'string', example: 'weight' },
              restTimeSec: { type: 'integer', example: 150 },
              sets: { type: 'array', items: { $ref: '#/components/schemas/WorkoutSet' } },
            },
          },
          WorkoutInput: {
            type: 'object',
            description: 'A finished workout (the `thisWorkout` object built in ActiveSession `handleFinish`). Only `title` and `date` are checked; the whole object is stored as-is.',
            additionalProperties: true,
            required: ['title', 'date'],
            properties: {
              title: { type: 'string', example: 'Legs Heavy' },
              date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', description: 'Format `YYYY-MM-DD`', example: '2026-10-24' },
              durationMinutes: { type: 'integer', example: 58 },
              totalVolumeKg: { type: 'number', example: 6800 },
              prsAchieved: { type: 'integer', example: 1 },
              completedExercises: { type: 'array', items: { type: 'string' }, example: ['Barbell Squat', 'Romanian Deadlift'] },
              exercises: { type: 'array', items: { $ref: '#/components/schemas/WorkoutExercise' } },
            },
          },
          Workout: {
            description: 'A saved workout: the object that was sent, with `id` set to the database id.',
            allOf: [
              { $ref: '#/components/schemas/WorkoutInput' },
              {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'Database id (replaces any `id` that was sent)', example: 'cm3xa1b2c0001qz8h5k6l7m8n' },
                },
              },
            ],
          },
        },
        responses: {
          BadRequest: {
            description: 'Invalid or missing data',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
          Unauthorized: {
            description: 'Missing, invalid or expired token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: { error: 'Please log in' },
              },
            },
          },
          ServerError: {
            description: 'Unexpected server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: { error: 'Server error' },
              },
            },
          },
        },
      },
    },
    apis: [
      path.join(rootDir, 'src/routes/*.js'),
      path.join(rootDir, 'src/server.js'),
    ],
  });
};

export const swaggerDocs = (app) => {
  const swaggerSpec = buildSpec();
  const port = process.env.PORT || 5001;

  // Raw OpenAPI JSON (useful for Postman / Insomnia imports or client generation)
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Exercise Logger API Docs',
      swaggerOptions: {
        persistAuthorization: true, // keep the token after a page refresh
        displayRequestDuration: true,
        docExpansion: 'list',
        filter: true,
        tryItOutEnabled: true,
      },
    }),
  );

  console.log(`📄 Swagger docs available at http://localhost:${port}/api-docs`);
};
