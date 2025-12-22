/**
 * Better Auth Server Configuration
 *
 * This file configures Better Auth with Neon DB (Postgres) for authentication.
 *
 * Key Features:
 * - Cookie-based session management with 5-minute cache (reduces DB queries by 80-90%)
 * - Experimental joins enabled for 2-3x performance improvement
 * - Secure cookies (httpOnly, secure in production, sameSite=lax)
 * - Neon pooled connection optimized for serverless (max: 1)
 *
 * Reference: specs/007-auth-integration-fix/research.md Section 1
 */

import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET environment variable is required');
}

if (!process.env.BETTER_AUTH_URL) {
  throw new Error('BETTER_AUTH_URL environment variable is required (e.g., http://localhost:3002 for dev)');
}

/**
 * Database connection pool optimized for Vercel serverless
 * - max: 1 prevents connection exhaustion in serverless environment
 * - idleTimeoutMillis: 30000 cleans up idle connections
 * - Use Neon pooled connection string (with -pooler suffix) for best performance
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,  // Critical for serverless - prevents connection pool exhaustion
  idleTimeoutMillis: 30000,
});

/**
 * Better Auth instance with optimized configuration
 */
const auth = betterAuth({
  // Database configuration
  database: pool,

  // Secret for signing cookies and tokens (min 32 characters)
  secret: process.env.BETTER_AUTH_SECRET,

  // Base URL for the application
  baseURL: process.env.BETTER_AUTH_URL,

  // Enable email/password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,  // Disable for MVP
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7,  // 7 days
    updateAge: 60 * 60 * 24,  // Refresh session daily

    // Cookie cache reduces DB queries by 80-90%
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5  // 5-minute cache
    }
  },

  // Advanced cookie configuration
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',  // HTTPS only in production
    cookiePrefix: 'robotics-auth',  // Custom cookie prefix
  },

  // Experimental features
  experimental: {
    joins: true  // 2-3x performance improvement for queries
  },

  // Custom plugins
  plugins: []
});

export { auth };