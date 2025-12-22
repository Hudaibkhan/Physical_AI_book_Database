# Production-Ready Auth Backend

A secure, scalable authentication backend built with **Better Auth**, **Express**, and **PostgreSQL**. Production-ready with comprehensive security features, rate limiting, and structured logging.

## 🚀 Features

- ✅ **Secure Authentication** - Email/password auth with bcrypt hashing
- ✅ **Session Management** - Cookie-based sessions with 5-minute cache
- ✅ **Rate Limiting** - Protection against brute force attacks
- ✅ **Security Headers** - Helmet.js with CSP, HSTS, XSS protection
- ✅ **CORS Support** - Multi-origin support for flexible deployment
- ✅ **Structured Logging** - Winston with JSON logs for production
- ✅ **Database Pool** - Singleton pattern prevents connection leaks
- ✅ **User Profiles** - Extended user data with personalization support
- ✅ **Health Checks** - Monitoring endpoint for load balancers
- ✅ **Serverless Ready** - Optimized for Vercel/AWS Lambda

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database (Neon DB recommended)
- npm or yarn

## 🛠️ Installation

### 1. Clone and Install

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Required Variables
DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname?sslmode=require
BETTER_AUTH_SECRET=your-secret-key-min-32-chars-long
BETTER_AUTH_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3002
```

**Generate a secure secret:**
```bash
openssl rand -base64 32
```

### 3. Setup Database

Run migrations to create tables:

```bash
psql $DATABASE_URL -f migrations/001_better_auth_core.sql
psql $DATABASE_URL -f migrations/002_user_profiles.sql
```

Or use your database client to execute the SQL files.

### 4. Start the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will start at `http://localhost:8000` (or your configured PORT).

## 📡 API Endpoints

### Authentication Endpoints (Better Auth)

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/auth/sign-up/email` | Register new user | 5 req/15min |
| POST | `/api/auth/sign-in/email` | Login user | 5 req/15min |
| POST | `/api/auth/sign-out` | Logout user | - |
| GET | `/api/auth/session` | Get current session | - |

**Sign Up Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "skill_level": "intermediate",
  "software_background": "Python, JavaScript",
  "hardware_background": "Arduino, Raspberry Pi",
  "learning_goal": "Build AI-powered robots"
}
```

**Sign In Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

### User Profile Endpoints (Authenticated)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/user/profile` | Get user profile | ✅ |
| PUT | `/api/user/profile` | Update user profile | ✅ |

**Get Profile Response:**
```json
{
  "success": true,
  "profile": {
    "userId": "abc123",
    "skillLevel": "intermediate",
    "softwareBackground": "Python, JavaScript",
    "hardwareBackground": "Arduino",
    "learningGoal": "Build robots",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Personalization Endpoint (Authenticated)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/personalize` | Personalize content | ✅ |

**Request:**
```json
{
  "chapterId": "chapter-1",
  "content": "Introduction to robotics..."
}
```

**Response:**
```json
{
  "success": true,
  "chapterId": "chapter-1",
  "personalizedContent": "Introduction to robotics (explained for beginners)...",
  "userMetadata": {
    "skillLevel": "beginner",
    "learningGoal": "Learn robotics basics"
  }
}
```

### Chat Endpoint (Authenticated)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/chat` | AI chat (placeholder) | ✅ |

**Note:** This is a placeholder endpoint. Integrate with your AI backend.

### Health & Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Root status check |
| GET | `/api` | API documentation |
| GET | `/api/health` | Health check endpoint |

## 🔒 Security Features

### 1. Rate Limiting

- **Auth endpoints:** 5 requests per 15 minutes
- **API endpoints:** 100 requests per 15 minutes (configurable)
- **Password reset:** 3 requests per hour

### 2. Security Headers (Helmet.js)

- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options (MIME sniffing prevention)
- XSS Filter

### 3. Authentication Security

- Bcrypt password hashing (via Better Auth)
- HttpOnly cookies (XSS protection)
- Secure cookies in production (HTTPS only)
- Session expiration: 7 days
- Session refresh: Daily

### 4. Database Security

- Parameterized queries (SQL injection prevention)
- Singleton connection pool (leak prevention)
- Connection timeout: 5 seconds
- Idle timeout: 30 seconds

### 5. CORS Configuration

- Multi-origin support
- Credentials enabled (cookies)
- Exposed rate limit headers

## 📊 Logging

Structured logging with Winston:

**Development:** Human-readable colored logs
```
2024-01-01 12:00:00 [info]: Server started {"port":8000,"environment":"development"}
```

**Production:** JSON logs for aggregators
```json
{
  "level": "info",
  "message": "Server started",
  "timestamp": "2024-01-01 12:00:00",
  "port": 8000,
  "environment": "production"
}
```

**Log Levels:**
- `error` - Critical errors
- `warn` - Warnings (rate limits, CORS blocks)
- `info` - Important events (server start, auth)
- `debug` - Detailed information (queries, auth checks)

Configure with `LOG_LEVEL` environment variable.

## 🚀 Deployment

### Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Configure Environment Variables:**

   Go to Vercel dashboard → Project Settings → Environment Variables

   Add all variables from `.env.example`:
   - `DATABASE_URL` (use Neon pooled connection)
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL` (your Vercel domain)
   - `FRONTEND_URL`
   - `ALLOWED_ORIGINS`
   - `NODE_ENV=production`

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Verify:**
   ```bash
   curl https://your-domain.vercel.app/api/health
   ```

### Vercel Configuration

The `vercel.json` is already configured:

```json
{
  "version": 2,
  "functions": {
    "api/[[...route]].js": {
      "runtime": "nodejs20.x"
    }
  }
}
```

### Other Platforms

**AWS Lambda / API Gateway:**
- Use the `server.mjs` export
- Wrap with serverless-http

**Docker:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8000
CMD ["node", "api-server.mjs"]
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | - | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | ✅ | - | Secret for signing (32+ chars) |
| `BETTER_AUTH_URL` | ✅ | - | Backend base URL |
| `FRONTEND_URL` | ✅ | - | Frontend URL for CORS |
| `ALLOWED_ORIGINS` | ❌ | `FRONTEND_URL` | Comma-separated origins |
| `NODE_ENV` | ❌ | `development` | Environment mode |
| `PORT` | ❌ | `8000` | Server port |
| `LOG_LEVEL` | ❌ | `debug`/`info` | Logging level |
| `RATE_LIMIT_WINDOW_MS` | ❌ | `900000` | Rate limit window |
| `RATE_LIMIT_MAX_REQUESTS` | ❌ | `100` | Max requests per window |

### Database Connection

**For Neon DB, use the pooled connection:**

❌ Wrong:
```
postgresql://user:pass@host.neon.tech/dbname
```

✅ Correct:
```
postgresql://user:pass@host-pooler.neon.tech/dbname
```

The `-pooler` suffix is crucial for serverless performance.

## 🧪 Testing

**Manual Testing with cURL:**

```bash
# Health check
curl http://localhost:8000/api/health

# Sign up
curl -X POST http://localhost:8000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Sign in (save cookies)
curl -X POST http://localhost:8000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  -c cookies.txt

# Get profile (use cookies)
curl http://localhost:8000/api/user/profile \
  -b cookies.txt
```

**Using Postman/Insomnia:**

1. Import the endpoints from this README
2. Enable "Send cookies automatically"
3. Test authentication flow

## 📁 Project Structure

```
backend/
├── api/
│   └── [[...route]].js      # Vercel serverless handler
├── lib/
│   ├── auth.mjs             # Better Auth configuration
│   ├── auth-plugins.mjs     # User profile plugin
│   ├── database.mjs         # Singleton DB pool
│   ├── logger.mjs           # Winston logging
│   └── env-validator.mjs    # Environment validation
├── middleware/
│   ├── auth.mjs             # Authentication middleware
│   └── rate-limit.mjs       # Rate limiting middleware
├── migrations/
│   ├── 001_better_auth_core.sql
│   └── 002_user_profiles.sql
├── utils/
│   └── api-handler.mjs      # API routes
├── api-server.mjs           # Local dev entry point
├── server.mjs               # Express app
├── load-env.js              # Environment loader
├── package.json
├── vercel.json
└── .env.example
```

## 🐛 Troubleshooting

### Database Connection Issues

**Error:** "too many connections"
- Use Neon pooled connection string (with `-pooler`)
- Check `max: 1` in pool configuration

**Error:** "timeout acquiring client"
- Increase `connectionTimeoutMillis` in `lib/database.mjs`
- Check database is accessible

### Authentication Issues

**Error:** "Unauthorized" on protected endpoints
- Ensure cookies are sent with requests
- Check `credentials: true` in CORS config
- Verify `FRONTEND_URL` matches request origin

**Error:** "CORS blocked"
- Add your frontend URL to `ALLOWED_ORIGINS`
- Use exact URL (including protocol and port)

### Rate Limiting Issues

**Error:** "Too many requests"
- Wait for the time specified in `retryAfter`
- Adjust limits with `RATE_LIMIT_*` env variables

### Logging Issues

**Logs not showing:**
- Check `LOG_LEVEL` environment variable
- In production, use log aggregators (Vercel logs, CloudWatch)

## 🔐 Production Checklist

Before deploying to production:

- [ ] Change `BETTER_AUTH_SECRET` to strong random value (32+ chars)
- [ ] Use HTTPS for all URLs (`BETTER_AUTH_URL`, `FRONTEND_URL`)
- [ ] Use Neon pooled connection string (`-pooler` suffix)
- [ ] Set `NODE_ENV=production`
- [ ] Set `LOG_LEVEL=info` or `warn`
- [ ] Configure all `ALLOWED_ORIGINS`
- [ ] Test all endpoints in production environment
- [ ] Set up monitoring/error tracking (Sentry recommended)
- [ ] Enable database backups
- [ ] Review rate limits for your traffic
- [ ] Test CORS with actual frontend
- [ ] Verify health check endpoint

## 📚 Additional Resources

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Neon Database Documentation](https://neon.tech/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Better Auth documentation
3. Check server logs for errors
4. Open an issue on GitHub

## 📝 License

MIT

---

**Version:** 2.0.0 (Production-Ready)
**Last Updated:** 2024-12-23
