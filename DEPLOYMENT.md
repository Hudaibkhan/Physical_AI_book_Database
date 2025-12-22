# Deployment Guide

Complete step-by-step guide for deploying the auth backend to production.

## 🎯 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] PostgreSQL database (Neon DB recommended)
- [ ] Database migrations applied
- [ ] Strong `BETTER_AUTH_SECRET` generated (32+ characters)
- [ ] Frontend URL configured
- [ ] All required environment variables ready

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

**Pros:**
- Zero configuration deployment
- Automatic HTTPS
- Global CDN
- Generous free tier
- Perfect for serverless

**Steps:**

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Link Project**
   ```bash
   cd backend
   vercel link
   ```

4. **Add Environment Variables**

   Option A: Via CLI
   ```bash
   vercel env add DATABASE_URL
   vercel env add BETTER_AUTH_SECRET
   vercel env add BETTER_AUTH_URL
   vercel env add FRONTEND_URL
   vercel env add ALLOWED_ORIGINS
   vercel env add NODE_ENV
   ```

   Option B: Via Dashboard
   1. Go to https://vercel.com/dashboard
   2. Select your project
   3. Go to Settings → Environment Variables
   4. Add each variable for Production environment

5. **Deploy**
   ```bash
   vercel --prod
   ```

6. **Verify Deployment**
   ```bash
   curl https://your-domain.vercel.app/api/health
   ```

   Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "2024-12-23T...",
     "service": "auth-backend",
     "environment": "production"
   }
   ```

### Option 2: Railway

**Pros:**
- Simple deployment
- Built-in database support
- Automatic deployments from Git

**Steps:**

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Initialize**
   ```bash
   railway login
   railway init
   ```

3. **Add PostgreSQL Database**
   ```bash
   railway add postgresql
   ```

4. **Set Environment Variables**
   ```bash
   railway variables set BETTER_AUTH_SECRET="your-secret"
   railway variables set BETTER_AUTH_URL="https://your-app.up.railway.app"
   railway variables set FRONTEND_URL="https://your-frontend.com"
   railway variables set NODE_ENV="production"
   ```

5. **Deploy**
   ```bash
   railway up
   ```

### Option 3: AWS Lambda (Advanced)

**Prerequisites:**
- AWS Account
- AWS CLI configured
- Serverless Framework

**Steps:**

1. **Install Serverless Framework**
   ```bash
   npm install -g serverless
   ```

2. **Create serverless.yml**
   ```yaml
   service: auth-backend

   provider:
     name: aws
     runtime: nodejs18.x
     region: us-east-1
     environment:
       DATABASE_URL: ${env:DATABASE_URL}
       BETTER_AUTH_SECRET: ${env:BETTER_AUTH_SECRET}
       BETTER_AUTH_URL: ${env:BETTER_AUTH_URL}
       FRONTEND_URL: ${env:FRONTEND_URL}
       NODE_ENV: production

   functions:
     api:
       handler: handler.handler
       events:
         - http:
             path: /{proxy+}
             method: ANY
   ```

3. **Create handler.js**
   ```javascript
   const serverless = require('serverless-http');
   const app = require('./server.mjs');

   module.exports.handler = serverless(app);
   ```

4. **Deploy**
   ```bash
   serverless deploy
   ```

### Option 4: Docker + Any Cloud

**Create Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port
EXPOSE 8000

# Start server
CMD ["node", "api-server.mjs"]
```

**Create .dockerignore:**
```
node_modules
.env
.git
*.log
.DS_Store
```

**Build and Run:**
```bash
# Build image
docker build -t auth-backend .

# Run container
docker run -d \
  -p 8000:8000 \
  -e DATABASE_URL="postgresql://..." \
  -e BETTER_AUTH_SECRET="..." \
  -e BETTER_AUTH_URL="https://..." \
  -e FRONTEND_URL="https://..." \
  -e NODE_ENV="production" \
  auth-backend
```

**Deploy to Cloud:**

**Google Cloud Run:**
```bash
gcloud run deploy auth-backend \
  --image gcr.io/your-project/auth-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**AWS ECS/Fargate:**
```bash
aws ecs create-service \
  --cluster your-cluster \
  --service-name auth-backend \
  --task-definition auth-backend \
  --desired-count 1
```

## 🔧 Environment Variables Setup

### Required Variables

| Variable | Production Value Example |
|----------|-------------------------|
| `DATABASE_URL` | `postgresql://user:pass@host-pooler.neon.tech/db?sslmode=require` |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` output |
| `BETTER_AUTH_URL` | `https://api.yourdomain.com` |
| `FRONTEND_URL` | `https://yourdomain.com` |
| `ALLOWED_ORIGINS` | `https://yourdomain.com,https://www.yourdomain.com` |
| `NODE_ENV` | `production` |

### Optional Variables

| Variable | Recommended Production Value |
|----------|----------------------------|
| `LOG_LEVEL` | `info` |
| `RATE_LIMIT_WINDOW_MS` | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` |

## 🗄️ Database Setup

### Neon DB (Recommended for Serverless)

1. **Create Database**
   - Go to https://neon.tech
   - Create new project
   - Note the connection string

2. **Get Pooled Connection**
   - In Neon dashboard, find "Connection pooling"
   - Copy the pooled connection string (ends with `-pooler`)
   - Use this as `DATABASE_URL`

3. **Run Migrations**
   ```bash
   psql "postgresql://user:pass@host-pooler.neon.tech/db" \
     -f migrations/001_better_auth_core.sql

   psql "postgresql://user:pass@host-pooler.neon.tech/db" \
     -f migrations/002_user_profiles.sql
   ```

### Alternative: Supabase

1. Create project at https://supabase.com
2. Go to Settings → Database
3. Copy connection string (pooler mode)
4. Run migrations via SQL Editor

### Alternative: AWS RDS

1. Create PostgreSQL instance
2. Configure security groups
3. Get connection string
4. Run migrations

## 🔐 Security Configuration

### 1. Generate Strong Secret

```bash
# Generate 32-byte random secret
openssl rand -base64 32
```

Use this output as `BETTER_AUTH_SECRET`.

### 2. Configure HTTPS

**Vercel/Railway:** Automatic HTTPS

**Custom Domain:**
- Use Let's Encrypt or cloud provider SSL
- Update `BETTER_AUTH_URL` to use `https://`
- Ensure `useSecureCookies` is enabled (automatic in production)

### 3. CORS Configuration

Add all your frontend domains:
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://app.yourdomain.com
```

### 4. Rate Limiting

Adjust for your traffic:
```env
# For high-traffic apps
RATE_LIMIT_MAX_REQUESTS=500

# For sensitive apps
RATE_LIMIT_MAX_REQUESTS=50
```

## 📊 Monitoring Setup

### 1. Logging (Recommended: Logtail/Better Stack)

Add to your deployment:

```javascript
// In lib/logger.mjs
import { Logtail } from '@logtail/node';

const logtail = new Logtail(process.env.LOGTAIL_TOKEN);

// Add logtail transport
transports.push(
  new winston.transports.Stream({
    stream: logtail
  })
);
```

### 2. Error Tracking (Sentry)

```bash
npm install @sentry/node
```

Add to `server.mjs`:
```javascript
import * as Sentry from '@sentry/node';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: 'production',
  });
}
```

### 3. Uptime Monitoring

Use:
- **UptimeRobot** (free): Check `/api/health` every 5 minutes
- **Better Uptime**: Advanced monitoring
- **Pingdom**: Enterprise option

Add monitor for:
```
https://your-domain.com/api/health
```

Expected response: Status 200, JSON with `"status": "ok"`

## ✅ Post-Deployment Verification

### 1. Test Health Check

```bash
curl https://your-domain.com/api/health
```

Expected: 200 OK

### 2. Test Authentication Flow

```bash
# Sign up
curl -X POST https://your-domain.com/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test"}'

# Sign in
curl -X POST https://your-domain.com/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

Expected: Session cookies set, 200 OK

### 3. Test CORS

```bash
curl -H "Origin: https://your-frontend.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  https://your-domain.com/api/auth/sign-in/email
```

Expected: CORS headers present

### 4. Test Rate Limiting

```bash
# Send 6 rapid requests (should block after 5)
for i in {1..6}; do
  curl -X POST https://your-domain.com/api/auth/sign-in/email \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo ""
done
```

Expected: 429 Too Many Requests after 5 attempts

### 5. Test Security Headers

```bash
curl -I https://your-domain.com/api/health
```

Expected headers:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

## 🚨 Troubleshooting Production Issues

### Database Connection Errors

**Error:** "too many connections"
```
Solution: Verify you're using pooled connection (-pooler suffix)
```

**Error:** "SSL connection required"
```
Solution: Add ?sslmode=require to DATABASE_URL
```

### CORS Errors

**Error:** "Origin not allowed"
```
Solution:
1. Check ALLOWED_ORIGINS includes your frontend URL
2. Ensure exact match (including http/https and port)
3. Check FRONTEND_URL is set
```

### Authentication Not Working

**Error:** "Session not found"
```
Solution:
1. Verify cookies are being sent (credentials: true in frontend)
2. Check CORS allows credentials
3. Verify BETTER_AUTH_URL matches your domain
```

### Rate Limiting Too Strict

```
Solution: Increase limits in environment variables
RATE_LIMIT_MAX_REQUESTS=500
RATE_LIMIT_WINDOW_MS=900000
```

## 🔄 Rollback Procedure

If deployment fails:

**Vercel:**
```bash
vercel rollback
```

**Railway:**
```bash
railway rollback
```

**Docker:**
```bash
# Deploy previous version
docker run -d previous-image-tag
```

## 📈 Scaling Considerations

### Database

- **Neon:** Auto-scales, no action needed
- **RDS:** Use read replicas for heavy traffic
- **Connection pooling:** Already configured (max: 1 per serverless instance)

### Application

- **Vercel:** Auto-scales up to 100 concurrent instances (Pro plan)
- **Railway:** Manual scaling in dashboard
- **Docker:** Use load balancer + multiple containers

### Caching

Add Redis for session caching (optional):
```javascript
// In lib/auth.mjs
session: {
  storage: 'redis',
  redisUrl: process.env.REDIS_URL
}
```

## 🎉 You're Live!

Once deployment is verified:

1. Update frontend to use production API URL
2. Test full authentication flow from frontend
3. Monitor logs for first 24 hours
4. Set up alerts for errors
5. Document any production-specific configurations

## 📞 Support

If you encounter issues:
1. Check logs: `vercel logs` or cloud provider logs
2. Review troubleshooting section above
3. Check database connectivity
4. Verify all environment variables

---

**Last Updated:** 2024-12-23
