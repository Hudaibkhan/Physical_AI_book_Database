// api/[[...route]].js - Catch-all API route for all endpoints
import server from '../server.mjs';

export default async function handler(req, res) {
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