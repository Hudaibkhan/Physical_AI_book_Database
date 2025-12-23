// api/[[...route]].js - Catch-all API route for all endpoints
import server from '../server.mjs';

export default async function handler(req, res) {
  // CRITICAL: Set CORS headers for Vercel serverless functions
  // This ensures headers are set even before Express processes the request
  const origin = req.headers.origin || '';
  const PRODUCTION_FRONTEND = 'https://physical-ai-and-humanoid-robotics-t-lake.vercel.app';

  // Check if origin is allowed
  // CRITICAL: Remove trailing slashes from allowed origins (common mistake in env vars)
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim().replace(/\/$/, ''))
    : [process.env.FRONTEND_URL || PRODUCTION_FRONTEND].map(o => o.replace(/\/$/, ''));

  // Also normalize the incoming origin (remove trailing slash if present)
  const normalizedOrigin = origin.replace(/\/$/, '');

  const isAllowedOrigin = allowedOrigins.includes(normalizedOrigin) || !origin;

  if (isAllowedOrigin && origin) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin,Cookie');
    res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie,RateLimit-Limit,RateLimit-Remaining,RateLimit-Reset');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Add the originalUrl to match the request pattern expected by Express
  req.originalUrl = req.url;

  // Pass the request to the Express app
  await new Promise((resolve, reject) => {
    server(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export const config = {
  api: {
    externalResolver: true,
    bodyParser: false,
  },
};