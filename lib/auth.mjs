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
  // Using a function to dynamically validate origins based on request headers
  //
  // IMPORTANT: When using Vercel rewrites as a proxy, the Origin header handling is complex:
  // 1. Browser sends Origin header with frontend URL
  // 2. Vercel proxies the request but may modify/strip headers
  // 3. Backend receives request with potentially missing or modified Origin
  //
  // Solution: Use a function that checks multiple headers and allows trusted patterns
  trustedOrigins: async (request) => {
    const PRODUCTION_FRONTEND = 'https://physical-ai-and-humanoid-robotics-t-lake.vercel.app';
    const PRODUCTION_BACKEND = 'https://physical-ai-book-database.vercel.app';

    // Build static list of allowed origins
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

    // Get origin from request
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const xForwardedHost = request.headers.get('x-forwarded-host');

    // Log for debugging (only in development or when ALLOWED_ORIGINS includes debug)
    if (process.env.NODE_ENV !== 'production') {
      logger.debug('Better Auth origin check', {
        origin,
        referer,
        xForwardedHost,
        allowedOrigins
      });
    }

    // Check if origin matches allowed list
    if (origin && allowedOrigins.includes(origin)) {
      return true;
    }

    // CRITICAL: For Vercel proxy scenarios, check x-forwarded-host
    // When using /auth-api/* rewrites, the x-forwarded-host may contain the frontend host
    if (xForwardedHost) {
      const forwardedOrigin = `https://${xForwardedHost}`;
      if (allowedOrigins.includes(forwardedOrigin)) {
        return true;
      }
    }

    // Check referer as fallback (extract origin from referer URL)
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const refererOrigin = refererUrl.origin;
        if (allowedOrigins.includes(refererOrigin)) {
          return true;
        }
      } catch (e) {
        // Invalid referer URL, ignore
      }
    }

    // Log rejection for debugging
    logger.warn('Better Auth origin rejected', {
      origin,
      referer,
      xForwardedHost,
      allowedOrigins
    });

    return false;
  },

  // Experimental features
  experimental: {
    joins: true  // 2-3x performance improvement for queries
  },

  // Custom plugins
  plugins: []
});

export { auth };