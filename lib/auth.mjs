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
import { getPool } from './database.mjs';
import { logger } from './logger.mjs';

// Environment validation is now handled by env-validator.mjs
// This ensures consistent validation across the application

/**
 * Better Auth instance with optimized configuration
 */
const auth = betterAuth({
  // Database configuration - using singleton pool (THIS WORKS!)
  database: getPool(),

  // Secret for signing cookies and tokens (min 32 characters)
  secret: process.env.BETTER_AUTH_SECRET || 'dev-secret-min-32-chars-long-fallback',

  // Base URL for the application
  baseURL: process.env.BETTER_AUTH_URL || 'https://physical-ai-book-database.vercel.app',

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

  // Advanced cookie configuration for cross-domain authentication
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',  // HTTPS only in production
    cookiePrefix: 'robotics-auth',  // Custom cookie prefix

    // CRITICAL FIX: Do NOT use crossSubDomainCookies with domain
    // Setting domain: '.vercel.app' causes browsers to REJECT cookies on cross-origin requests
    // Use host-only cookies (no domain) with sameSite: 'none' for proper CORS
    crossSubDomainCookies: {
      enabled: false  // MUST be false for cross-origin auth to work
    },

    // CRITICAL: Cookie settings for cross-domain session persistence
    // sameSite: 'none' + secure: true + credentials: 'include' = proper CORS auth
    generateSessionToken: undefined,  // Use default
    cookieSameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',  // MUST be 'none' for cross-domain
  },

  // CRITICAL: Trusted origins for Better Auth CORS
  // This tells Better Auth which domains are allowed to make authenticated requests
  // FALLBACK: Hardcoded production frontend URL if env vars not set
  trustedOrigins: (() => {
    const PRODUCTION_FRONTEND = 'https://physical-ai-and-humanoid-robotics-t-lake.vercel.app';

    if (process.env.ALLOWED_ORIGINS) {
      return process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    } else if (process.env.FRONTEND_URL) {
      return [process.env.FRONTEND_URL];
    } else {
      // CRITICAL: Fallback to production URL if env vars not set
      logger.warn('Better Auth: Using hardcoded production frontend URL as fallback for trustedOrigins');
      return [PRODUCTION_FRONTEND];
    }
  })(),

  // Experimental features
  experimental: {
    joins: true  // 2-3x performance improvement for queries
  },

  // Custom plugins
  plugins: []
});

export { auth };