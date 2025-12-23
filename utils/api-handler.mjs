/**
 * API Handler - Production-Ready Edition
 *
 * This module creates the API router with all endpoints properly secured,
 * authenticated, and following best practices.
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import { auth } from '../lib/auth.mjs';
import { toNodeHandler } from 'better-auth/node';
import { query } from '../lib/database.mjs';
import { logger } from '../lib/logger.mjs';
import { requireAuth } from '../middleware/auth.mjs';
import { authRateLimiter, apiRateLimiter } from '../middleware/rate-limit.mjs';

/**
 * Create the API router with all endpoints
 */
const createRouter = () => {
  const router = express.Router();

  // Middleware
  router.use(express.json());
  router.use(cookieParser());

  // Apply rate limiting to API routes
  router.use(apiRateLimiter);

  // Convert Better Auth handler to Express-compatible middleware
  const betterAuthHandler = toNodeHandler(auth);

  // Better Auth endpoints with stricter rate limiting
  router.all('/auth/sign-in/*', authRateLimiter, betterAuthHandler);
  router.all('/auth/sign-up/*', authRateLimiter, betterAuthHandler);
  router.all('/auth/*', betterAuthHandler);
  router.all('/auth', betterAuthHandler);

  // Health check endpoint (no auth required)
  router.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'auth-backend',
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Root endpoint
  router.get('/', (req, res) => {
    res.json({
      message: 'Book RAG Agent API with Better Auth',
      version: '2.0.0',
      endpoints: {
        auth: '/api/auth',
        health: '/api/health',
        profile: '/api/user/profile',
        personalize: '/api/personalize'
      }
    });
  });

  /**
   * GET /api/user/profile
   * Get user profile (requires authentication)
   */
  router.get('/user/profile', requireAuth, async (req, res) => {
    try {
      // req.user is set by requireAuth middleware
      const userId = req.user.id;

      const result = await query(
        'SELECT * FROM user_profiles WHERE "userId" = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Profile not found',
          message: 'User profile does not exist. Please complete your profile setup.'
        });
      }

      const profile = result.rows[0];

      res.json({
        success: true,
        profile: {
          userId: profile.userId,
          skillLevel: profile.skill_level,
          softwareBackground: profile.software_background,
          hardwareBackground: profile.hardware_background,
          learningGoal: profile.learning_goal,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt
        }
      });
    } catch (error) {
      logger.error('Profile fetch error', {
        error: error.message,
        userId: req.user.id
      });

      res.status(500).json({
        error: 'Failed to fetch profile',
        message: 'An error occurred while retrieving your profile'
      });
    }
  });

  /**
   * PUT /api/user/profile
   * Update user profile (requires authentication)
   * SECURITY: userId is ALWAYS taken from session, NEVER from request body
   */
  router.put('/user/profile', requireAuth, async (req, res) => {
    try {
      // CRITICAL: Extract userId from authenticated session only
      const userId = req.user.id;

      // SECURITY: Explicitly ignore userId from request body (if sent)
      const { skillLevel, softwareBackground, hardwareBackground, learningGoal } = req.body;

      // SECURITY CHECK: If userId is in body, log warning but ignore it
      if (req.body.userId && req.body.userId !== userId) {
        logger.warn('Attempted userId manipulation in profile update', {
          sessionUserId: userId,
          attemptedUserId: req.body.userId,
          ip: req.ip
        });
      }

      // Validate at least one field is provided
      if (!skillLevel && !softwareBackground && !hardwareBackground && !learningGoal) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'At least one profile field must be provided'
        });
      }

      // Update profile in database
      await query(`
        INSERT INTO user_profiles (
          "userId",
          skill_level,
          software_background,
          hardware_background,
          learning_goal,
          "createdAt",
          "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT ("userId") DO UPDATE SET
          skill_level = COALESCE($2, user_profiles.skill_level),
          software_background = COALESCE($3, user_profiles.software_background),
          hardware_background = COALESCE($4, user_profiles.hardware_background),
          learning_goal = COALESCE($5, user_profiles.learning_goal),
          "updatedAt" = NOW()
      `, [
        userId,
        skillLevel || null,
        softwareBackground || null,
        hardwareBackground || null,
        learningGoal || null
      ]);

      logger.info('Profile updated', { userId });

      // Fetch updated profile
      const result = await query(
        'SELECT * FROM user_profiles WHERE "userId" = $1',
        [userId]
      );

      const profile = result.rows[0];

      res.json({
        success: true,
        message: 'Profile updated successfully',
        profile: {
          userId: profile.userId,
          skillLevel: profile.skill_level,
          softwareBackground: profile.software_background,
          hardwareBackground: profile.hardware_background,
          learningGoal: profile.learning_goal,
          updatedAt: profile.updatedAt
        }
      });
    } catch (error) {
      logger.error('Profile update error', {
        error: error.message,
        userId: req.user.id
      });

      res.status(500).json({
        error: 'Failed to update profile',
        message: 'An error occurred while updating your profile'
      });
    }
  });

  /**
   * POST /api/personalize
   * Personalize content based on user profile (requires authentication)
   */
  router.post('/personalize', requireAuth, async (req, res) => {
    try {
      const { chapterId, content } = req.body;

      if (!chapterId || !content) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Both chapterId and content are required'
        });
      }

      // Get user profile
      const result = await query(
        'SELECT * FROM user_profiles WHERE "userId" = $1',
        [req.user.id]
      );

      let personalizedContent = content;
      let userMetadata = {};

      if (result.rows.length > 0) {
        const profile = result.rows[0];
        userMetadata = {
          skillLevel: profile.skill_level,
          softwareBackground: profile.software_background,
          hardwareBackground: profile.hardware_background,
          learningGoal: profile.learning_goal
        };

        // Simple personalization logic
        // In production, this would use AI/ML models
        if (profile.software_background?.toLowerCase().includes('beginner')) {
          personalizedContent = personalizedContent.replace(
            /\b(concept|method|approach)\b/gi,
            '$1 (explained for beginners)'
          );
        } else if (profile.software_background?.toLowerCase().includes('advanced')) {
          personalizedContent = personalizedContent.replace(
            /\b(example|concept)\b/gi,
            '$1 (advanced details)'
          );
        }

        if (profile.learning_goal) {
          const goal = profile.learning_goal.toLowerCase();
          if (goal.includes('ai') || goal.includes('ml')) {
            personalizedContent += '\n\n*Tailored for AI/ML learners*';
          } else if (goal.includes('robotics')) {
            personalizedContent += '\n\n*Tailored for robotics enthusiasts*';
          }
        }
      }

      logger.info('Content personalized', {
        userId: req.user.id,
        chapterId
      });

      res.json({
        success: true,
        chapterId,
        personalizedContent,
        userMetadata
      });
    } catch (error) {
      logger.error('Personalization error', {
        error: error.message,
        userId: req.user.id
      });

      res.status(500).json({
        error: 'Personalization failed',
        message: 'An error occurred while personalizing content'
      });
    }
  });

  /**
   * POST /api/chat
   * Chat endpoint placeholder
   * NOTE: This is a placeholder. Implement with your AI backend.
   */
  router.post('/chat', requireAuth, async (req, res) => {
    try {
      const { message, selectedText, sessionId } = req.body;

      if (!message) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Message is required'
        });
      }

      logger.info('Chat request received', {
        userId: req.user.id,
        sessionId: sessionId || 'default'
      });

      // TODO: Implement actual AI chat integration
      res.json({
        success: true,
        response: `This is a placeholder response. To implement: integrate with your AI backend using the message: "${message}"`,
        sourceChunks: [],
        sessionId: sessionId || 'default-session',
        citations: [],
        note: 'This endpoint requires AI integration. See README for implementation details.'
      });
    } catch (error) {
      logger.error('Chat error', {
        error: error.message,
        userId: req.user.id
      });

      res.status(500).json({
        error: 'Chat failed',
        message: 'An error occurred while processing your message'
      });
    }
  });

  return router;
};

export default createRouter;
