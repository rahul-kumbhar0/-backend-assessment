// Main Express app config: middleware, routes, docs, and error handlers live here.
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import websiteRoutes from './routes/website.routes.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';

const app = express(); // single app instance exported for server.js to run

// Basic hardening + observability
app.use(cors()); // allow cross-origin requests (Postman, web clients, etc.)
app.use(express.json({ limit: '1mb' })); // parse JSON bodies with a safe limit
app.use(morgan('dev')); // concise request logs in dev

// Throttle abuse a bit: 60 requests/minute per IP
const limiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 60 });
app.use(limiter);

// Simple uptime check for Render and monitoring
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Versionless API mount (could switch to /v1 later if needed)
app.use('/api', websiteRoutes);

// Lightweight OpenAPI doc generation for quick API discovery/testing
const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Website Analysis API', version: '1.0.0' },
    servers: [{ url: 'http://localhost:' + (process.env.PORT || 8080) }],
  },
  apis: ['./src/routes/*.js'],
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // Swagger UI

// Fallbacks: 404 for unknown routes, then centralized error serialization
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
