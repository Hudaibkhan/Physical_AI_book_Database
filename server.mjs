/**
 * Production-Ready Express Server
 *
 * Compatible with both local development and Vercel serverless deployment.
 * Includes security headers, CORS, rate limiting, and structured logging.
 */

// Load and validate environment variables first
import './load-env.js';
import { validateEnv } from './lib/env-validator.mjs';
import { logger, requestLogger, setupErrorHandlers } from './lib/logger.mjs';

// Validate environment before starting
try {
  validateEnv();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

// Setup error handlers
setupErrorHandlers();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import createApiRouter from './utils/api-handler.mjs';

/**
 * CORS origin validator
 * Supports multiple origins from ALLOWED_ORIGINS env variable
 * CRITICAL: Includes hardcoded production URLs as fallback for Vercel deployment
 */
function corsOriginValidator(origin, callback) {
  // Allow requests with no origin (mobile apps, Postman, etc.)
  if (!origin) {
    return callback(null, true);
  }

  // Hardcoded production frontend URL as fallback
  const PRODUCTION_FRONTEND = 'https://physical-ai-and-humanoid-robotics-t-lake.vercel.app';

  // Get allowed origins from env with production fallback
  let allowedOrigins = [];

  if (process.env.ALLOWED_ORIGINS) {
    allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
  } else if (process.env.FRONTEND_URL) {
    allowedOrigins = [process.env.FRONTEND_URL];
  } else {
    // CRITICAL: Fallback to production URL if env vars not set
    allowedOrigins = [PRODUCTION_FRONTEND];
    logger.warn('CORS: Using hardcoded production frontend URL as fallback', {
      origin,
      fallback: PRODUCTION_FRONTEND
    });
  }

  // Also always include localhost for development
  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:3002');
    allowedOrigins.push('http://localhost:3000');
    allowedOrigins.push('http://localhost:3001');
  }

  // Check if origin is allowed
  if (allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    logger.warn('CORS blocked request', {
      origin,
      allowedOrigins,
      envVarsSet: {
        ALLOWED_ORIGINS: !!process.env.ALLOWED_ORIGINS,
        FRONTEND_URL: !!process.env.FRONTEND_URL,
        NODE_ENV: process.env.NODE_ENV
      }
    });
    callback(new Error('Not allowed by CORS'));
  }
}

/**
 * Create the Express app with all middleware
 */
const createApp = () => {
  const app = express();

  // Trust proxy (required for rate limiting and IP detection behind Vercel)
  app.set('trust proxy', 1);

  // CRITICAL: CORS middleware MUST be applied BEFORE helmet
  // This ensures CORS headers are set before any other security headers
  // CRITICAL: This configuration allows cross-domain authentication to work on Vercel
  app.use(cors({
    origin: corsOriginValidator,
    credentials: true,  // CRITICAL: Allow cookies to be sent cross-domain
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cookie'  // Explicitly allow Cookie header
    ],
    exposedHeaders: [
      'Set-Cookie',  // Explicitly expose Set-Cookie header
      'RateLimit-Limit',
      'RateLimit-Remaining',
      'RateLimit-Reset'
    ],
    maxAge: 86400,  // Cache preflight for 24 hours (reduces OPTIONS requests)
    preflightContinue: false,  // Pass preflight response to next handler
    optionsSuccessStatus: 200  // CRITICAL: Return 200 for OPTIONS (some legacy browsers use 204)
  }));

  // CRITICAL: Explicit OPTIONS handler for all routes
  // This ensures preflight requests always get proper CORS headers
  app.options('*', cors({
    origin: corsOriginValidator,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cookie'
    ],
    maxAge: 86400,
    optionsSuccessStatus: 200
  }));

  // Security headers using helmet (AFTER CORS)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    frameguard: {
      action: 'deny' // Prevent clickjacking
    },
    noSniff: true, // Prevent MIME type sniffing
    xssFilter: true, // Enable XSS filter
  }));

  // Request logging
  app.use(requestLogger);

  // Use the API router that contains all the routes
  app.use('/api', createApiRouter());

  // Root health check endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'Book RAG Agent API with Better Auth',
      status: 'running',
      version: '2.0.0',
      documentation: '/api'
    });
  });

  // CORS debug endpoint - helps diagnose CORS issues in production
  app.get('/cors-debug', (req, res) => {
    const origin = req.get('Origin');
    const PRODUCTION_FRONTEND = 'https://physical-ai-and-humanoid-robotics-t-lake.vercel.app';

    let allowedOrigins = [];
    if (process.env.ALLOWED_ORIGINS) {
      allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    } else if (process.env.FRONTEND_URL) {
      allowedOrigins = [process.env.FRONTEND_URL];
    } else {
      allowedOrigins = [PRODUCTION_FRONTEND];
    }

    res.json({
      corsDebug: {
        requestOrigin: origin || 'no-origin',
        allowedOrigins: allowedOrigins,
        isOriginAllowed: origin ? allowedOrigins.includes(origin) : 'no-origin-provided',
        environmentVariables: {
          ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'not-set',
          FRONTEND_URL: process.env.FRONTEND_URL || 'not-set',
          NODE_ENV: process.env.NODE_ENV || 'not-set',
          BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'not-set'
        },
        productionFallback: PRODUCTION_FRONTEND,
        timestamp: new Date().toISOString()
      }
    });
  });

  // 404 handler
  app.use((req, res) => {
    logger.warn('404 Not Found', {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip
    });

    res.status(404).json({
      error: 'Not Found',
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
      availableEndpoints: {
        api: '/api',
        auth: '/api/auth',
        health: '/api/health'
      }
    });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    logger.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method
    });

    // Don't expose error details in production
    const isDevelopment = process.env.NODE_ENV !== 'production';

    res.status(err.status || 500).json({
      error: 'Internal Server Error',
      message: isDevelopment ? err.message : 'An unexpected error occurred',
      ...(isDevelopment && { stack: err.stack })
    });
  });

  return app;
};

const app = createApp();

logger.info('Server initialized', {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT
});

// Export the app for use in Vercel serverless functions
export default app;

// Only start the server if this is run directly (not imported)
if (typeof window === 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT || 8000;
  app.listen(port, () => {
    logger.info('Server started', {
      port,
      environment: process.env.NODE_ENV,
      baseURL: process.env.BETTER_AUTH_URL
    });
  });
}
