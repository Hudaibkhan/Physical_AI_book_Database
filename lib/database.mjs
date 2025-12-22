/**
 * Singleton Database Pool
 *
 * This module provides a single shared database connection pool
 * to prevent connection leaks and exhaustion in serverless environments.
 *
 * CRITICAL: Always use getPool() to access the database pool.
 * Never create new Pool instances in request handlers.
 */

import { Pool } from 'pg';
import { logger } from './logger.mjs';

let pool = null;

/**
 * Get or create the singleton database pool
 * @returns {Pool} The shared database connection pool
 */
export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,  // Critical for serverless - prevents connection pool exhaustion
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Log pool events for monitoring
    pool.on('connect', () => {
      logger.debug('New database client connected');
    });

    pool.on('error', (err) => {
      logger.error('Unexpected database pool error', { error: err.message });
    });

    logger.info('Database pool initialized');
  }

  return pool;
}

/**
 * Execute a database query safely with automatic error handling
 * @param {string} text - SQL query with $1, $2, etc. placeholders
 * @param {Array} params - Query parameters
 * @returns {Promise<any>} Query result
 */
export async function query(text, params) {
  const pool = getPool();
  const start = Date.now();

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    logger.debug('Executed query', {
      duration,
      rows: result.rowCount,
      query: text.substring(0, 100) // Log first 100 chars
    });

    return result;
  } catch (error) {
    logger.error('Database query error', {
      error: error.message,
      query: text.substring(0, 100),
      params: params?.length || 0
    });
    throw error;
  }
}

/**
 * Close the database pool (for graceful shutdown)
 * Note: In serverless, connections are typically managed by the platform
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database pool closed');
  }
}
