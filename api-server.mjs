// api-server.js - Node.js server with Express to handle Better Auth and API routes
import './load-env.js';  // Load environment variables before other imports
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { auth } from './lib/auth.mjs';
import { toNodeHandler } from 'better-auth/node';
import { Pool } from 'pg';

const app = express();
const port = process.env.PORT || 8000;

// CORS middleware with credentials enabled (required for cookies)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3002',
  credentials: true,  // CRITICAL: Allow cookies to be sent
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());  // Parse cookies for session management

// Convert Better Auth handler to Express-compatible middleware
const betterAuthHandler = toNodeHandler(auth);

app.all('/api/auth', betterAuthHandler);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Book RAG Agent API with Better Auth is running' });
});

// Get user profile endpoint (requires authentication)
app.get('/api/user/profile', async (req, res) => {
  try {
    // Extract session token from cookies
    const sessionToken = req.cookies?.['robotics-auth.session_token'];

    if (!sessionToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get session from Better Auth
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Query user profile from database
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    const result = await pool.query(
      'SELECT * FROM user_profiles WHERE "userId" = $1',
      [session.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      profile: result.rows[0]
    });

    await pool.end();
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Personalization endpoint
app.post('/api/personalize', async (req, res) => {
  try {
    const { chapter_id, currentContent, user_metadata } = req.body;

    if (!chapter_id || !currentContent || !user_metadata) {
      return res.status(400).json({ error: 'Missing required fields: chapter_id, currentContent, and user_metadata' });
    }

    // Personalize the content based on user profile without adding profile data
    // This simulates AI-based personalization that adjusts content depth, examples, terminology, etc.
    let personalizedContent = currentContent;

    // Adjust content based on user's skill level and learning goal
    if (user_metadata.software_background) {
      // Simplify or enhance content based on user's background
      if (user_metadata.software_background.includes('beginner')) {
        // Add more explanations for beginners
        personalizedContent = personalizedContent.replace(/\b(concept|method|approach)\b/gi, '$1 (basic concept)');
      } else if (user_metadata.software_background.includes('advanced')) {
        // Add more technical depth for advanced users
        personalizedContent = personalizedContent.replace(/\b(example|concept|method)\b/gi, '$1 (advanced implementation)');
      }
    }

    if (user_metadata.learning_goal) {
      // Adjust focus based on learning goal
      if (user_metadata.learning_goal.toLowerCase().includes('ai') || user_metadata.learning_goal.toLowerCase().includes('ml')) {
        personalizedContent += '\n\n*This explanation is tailored for AI/ML learners.*';
      } else if (user_metadata.learning_goal.toLowerCase().includes('robotics')) {
        personalizedContent += '\n\n*This explanation is tailored for robotics enthusiasts.*';
      }
    }

    res.json({
      personalized_content: personalizedContent,
      chapter_id: chapter_id,
      user_metadata: user_metadata
    });
  } catch (error) {
    console.error('Personalization error:', error);
    // Check if it's a database connection error
    if (error.message && (error.message.includes('database') || error.message.includes('connection') || error.message.includes('pool'))) {
      res.status(503).json({ error: 'Database service temporarily unavailable. Please try again later.' });
    } else {
      res.status(500).json({ error: 'Personalization processing failed' });
    }
  }
});

// Example chat endpoint (placeholder - would need actual implementation)
app.post('/chat', async (req, res) => {
  try {
    const { message, selected_text, session_id } = req.body;

    // Placeholder response - in a real implementation, this would connect to your AI backend
    res.json({
      response: `This is a placeholder response for: ${message}`,
      source_chunks: [],
      session_id: session_id || 'default-session',
      citations: []
    });
  } catch (error) {
    res.status(500).json({ error: 'Chat processing failed' });
  }
});

// Endpoint to update user profile
app.put('/api/auth/profile', async (req, res) => {
  try {
    const { software_background, hardware_background, learning_goal } = req.body;

    // In a real implementation, this would update the user's profile in the database
    // For now, we'll just return a success response
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        software_background,
        hardware_background,
        learning_goal
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
  console.log(`Better Auth API available at http://localhost:${port}/api/auth`);
});

export default app;