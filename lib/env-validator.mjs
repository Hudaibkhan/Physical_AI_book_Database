/**
 * Environment Variable Validation
 *
 * Validates all required environment variables at startup to fail fast
 * with clear error messages rather than failing during runtime.
 */

import { logger } from './logger.mjs';

const requiredEnvVars = [
  {
    name: 'DATABASE_URL',
    description: 'PostgreSQL connection string (should end with -pooler for Neon)',
    validator: (value) => {
      if (!value.startsWith('postgres://') && !value.startsWith('postgresql://')) {
        return 'Must be a valid PostgreSQL connection string (postgres:// or postgresql://)';
      }
      return null;
    }
  },
  {
    name: 'BETTER_AUTH_SECRET',
    description: 'Secret key for signing cookies and tokens (min 32 characters)',
    validator: (value) => {
      if (value.length < 32) {
        return 'Must be at least 32 characters long for security';
      }
      return null;
    }
  },
  {
    name: 'BETTER_AUTH_URL',
    description: 'Base URL for the application (e.g., http://localhost:8000)',
    validator: (value) => {
      try {
        new URL(value);
        return null;
      } catch {
        return 'Must be a valid URL';
      }
    }
  },
  {
    name: 'FRONTEND_URL',
    description: 'Frontend URL for CORS (e.g., http://localhost:3002)',
    validator: (value) => {
      try {
        new URL(value);
        return null;
      } catch {
        return 'Must be a valid URL';
      }
    }
  }
];

const optionalEnvVars = [
  {
    name: 'ALLOWED_ORIGINS',
    description: 'Comma-separated list of allowed CORS origins',
    default: null
  },
  {
    name: 'NODE_ENV',
    description: 'Environment (development, production, test)',
    default: 'development'
  },
  {
    name: 'PORT',
    description: 'Server port',
    default: '8000'
  },
  {
    name: 'LOG_LEVEL',
    description: 'Logging level (error, warn, info, debug)',
    default: 'info'
  },
  {
    name: 'RATE_LIMIT_WINDOW_MS',
    description: 'Rate limit window in milliseconds',
    default: '900000' // 15 minutes
  },
  {
    name: 'RATE_LIMIT_MAX_REQUESTS',
    description: 'Max requests per window',
    default: '100'
  }
];

/**
 * Validate all environment variables
 * @throws {Error} If validation fails
 */
export function validateEnv() {
  const errors = [];

  // Check required variables
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar.name];

    if (!value) {
      errors.push(`❌ ${envVar.name} is required: ${envVar.description}`);
      continue;
    }

    // Run custom validator if provided
    if (envVar.validator) {
      const validationError = envVar.validator(value);
      if (validationError) {
        errors.push(`❌ ${envVar.name} is invalid: ${validationError}`);
      }
    }
  }

  // Set defaults for optional variables
  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar.name] && envVar.default) {
      process.env[envVar.name] = envVar.default;
      logger.debug(`Using default for ${envVar.name}`, { default: envVar.default });
    }
  }

  // If there are errors, throw with all of them
  if (errors.length > 0) {
    const errorMessage = [
      '',
      '═══════════════════════════════════════════════════════════',
      '  ENVIRONMENT VARIABLE VALIDATION FAILED',
      '═══════════════════════════════════════════════════════════',
      '',
      ...errors,
      '',
      '📝 Create a .env file with the following variables:',
      '',
      ...requiredEnvVars.map(v => `${v.name}=your_value_here  # ${v.description}`),
      '',
      '═══════════════════════════════════════════════════════════',
      ''
    ].join('\n');

    throw new Error(errorMessage);
  }

  logger.info('Environment variables validated successfully', {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    logLevel: process.env.LOG_LEVEL
  });
}

/**
 * Get a validated environment variable
 * @param {string} name - Environment variable name
 * @param {string} defaultValue - Default value if not set
 * @returns {string} The environment variable value
 */
export function getEnv(name, defaultValue = undefined) {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is not set and no default provided`);
  }
  return value || defaultValue;
}
