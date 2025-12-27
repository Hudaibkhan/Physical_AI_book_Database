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

  // CRITICAL: Trusted origins for Better Auth CORS and CSRF protection
  //
  // Using a function to dynamically build the allowed origins list.
  // The function MUST return an array of origin strings, NOT a boolean.
  // The request parameter may be undefined during initialization.
  //
  // IMPORTANT: When using Vercel rewrites as a proxy:
  // - Include both frontend AND backend URLs
  // - The proxy may send requests with different Origin headers
  trustedOrigins: (request) => {
    const PRODUCTION_FRONTEND = 'https://physical-ai-and-humanoid-robotics-t-lake.vercel.app';
    const PRODUCTION_BACKEND = 'https://physical-ai-book-database.vercel.app';

    // Build list of allowed origins
    let allowedOrigins = [];

    if (process.env.ALLOWED_ORIGINS) {
      allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    } else if (process.env.FRONTEND_URL) {
      allowedOrigins = [process.env.FRONTEND_URL];
    } else {
      allowedOrigins = [PRODUCTION_FRONTEND];
    }

    // Always include backend URL for proxy scenarios
    if (!allowedOrigins.includes(PRODUCTION_BACKEND)) {
      allowedOrigins.push(PRODUCTION_BACKEND);
    }

    // Add BETTER_AUTH_URL if set
    const betterAuthUrl = process.env.BETTER_AUTH_URL;
    if (betterAuthUrl && !allowedOrigins.includes(betterAuthUrl)) {
      allowedOrigins.push(betterAuthUrl);
    }

    // Add localhost for development
    if (process.env.NODE_ENV !== 'production') {
      allowedOrigins.push('http://localhost:3002');
      allowedOrigins.push('http://localhost:3000');
      allowedOrigins.push('http://localhost:8000');
    }

    // CRITICAL: For Vercel proxy scenarios, dynamically add x-forwarded-host origin
    // When requests come through /auth-api/* rewrite, we need to trust the forwarded host
    if (request && request.headers) {
      try {
        const xForwardedHost = request.headers.get?.('x-forwarded-host') || request.headers['x-forwarded-host'];
        if (xForwardedHost && !allowedOrigins.includes(`https://${xForwardedHost}`)) {
          allowedOrigins.push(`https://${xForwardedHost}`);
        }
      } catch (e) {
        // Ignore header access errors
      }
    }

    return allowedOrigins;
  },

  // Experimental features
  experimental: {
    joins: true  // 2-3x performance improvement for queries
  },

  // Custom plugins
  plugins: []
});

export { auth };