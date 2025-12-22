// api-server.mjs - Main entry point for local development
import app from './server.mjs';

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
  console.log(`Better Auth API available at http://localhost:${port}/api/auth`);
});