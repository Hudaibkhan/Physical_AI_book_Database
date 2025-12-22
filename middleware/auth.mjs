/**
 * Authentication Middleware
 *
 * Provides middleware to protect routes requiring authentication.
 * Validates session tokens from cookies and attaches user/session to request.
 */

import { auth } from '../lib/auth.mjs';
import { logger } from '../lib/logger.mjs';

/**
 * Middleware to require authentication
 * Validates the session token and attaches user/session to req object
 *
 * Usage:
 *   router.get('/protected', requireAuth, handler);
 */
export async function requireAuth(req, res, next) {
  try {
    // Get session from Better Auth using request headers
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session || !session.user) {
      logger.warn('Unauthorized access attempt', {
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });

      return res.status(401).json({
        error: 'Unauthorized',
        message: 'You must be logged in to access this resource'
      });
    }

    // Attach user and session to request for use in handlers
    req.user = session.user;
    req.session = session.session;

    logger.debug('Authenticated request', {
      userId: req.user.id,
      email: req.user.email,
      url: req.originalUrl
    });

    next();
  } catch (error) {
    logger.error('Authentication error', {
      error: error.message,
      url: req.originalUrl
    });

    return res.status(500).json({
      error: 'Authentication failed',
      message: 'An error occurred while verifying your session'
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user/session if present, but doesn't require it
 *
 * Usage:
 *   router.get('/optional', optionalAuth, handler);
 */
export async function optionalAuth(req, res, next) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (session && session.user) {
      req.user = session.user;
      req.session = session.session;
    }

    next();
  } catch (error) {
    // Don't fail if authentication check fails for optional routes
    logger.debug('Optional auth check failed', { error: error.message });
    next();
  }
}
