/**
 * Rate Limiting Middleware
 *
 * Protects endpoints from brute force attacks and abuse.
 * Different limits for auth endpoints vs general API endpoints.
 */

import rateLimit from 'express-rate-limit';
import { logger } from '../lib/logger.mjs';

/**
 * Rate limiter for authentication endpoints
 * More strict to prevent brute force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again after 15 minutes',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded for auth endpoint', {
      ip: req.ip,
      url: req.originalUrl,
      userAgent: req.get('user-agent')
    });

    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Please try again after 15 minutes',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Rate limiter for general API endpoints
 * More lenient for normal operations
 */
export const apiRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests default
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: 'See Retry-After header'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded for API endpoint', {
      ip: req.ip,
      url: req.originalUrl,
      userAgent: req.get('user-agent')
    });

    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.'
    });
  }
});

/**
 * Very strict rate limiter for password reset
 * Prevents enumeration attacks
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  skipSuccessfulRequests: false,
  message: {
    error: 'Too many password reset attempts',
    message: 'Please try again after 1 hour',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded for password reset', {
      ip: req.ip,
      url: req.originalUrl
    });

    res.status(429).json({
      error: 'Too many password reset attempts',
      message: 'Please try again after 1 hour'
    });
  }
});
