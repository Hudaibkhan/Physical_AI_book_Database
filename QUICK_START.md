# Quick Start Guide

Get your auth backend running in 5 minutes.

## ⚡ Express Setup (5 minutes)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
# Copy example file
cp .env.example .env
```

Edit `.env` and add your values:

```env
DATABASE_URL=postgresql://user:pass@host-pooler.neon.tech/db
BETTER_AUTH_SECRET=paste-output-from-command-below
BETTER_AUTH_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3002
```

Generate secret:
```bash
openssl rand -base64 32
```

### 3. Setup Database

```bash
# Using psql
psql $DATABASE_URL -f migrations/001_better_auth_core.sql
psql $DATABASE_URL -f migrations/002_user_profiles.sql
```

Or copy the SQL from migrations/ and run in your database client.

### 4. Start Server

```bash
npm run dev
```

Server running at: `http://localhost:8000`

### 5. Test It

```bash
# Health check
curl http://localhost:8000/api/health

# Sign up
curl -X POST http://localhost:8000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User"
  }'
```

## 🎯 Common Commands

```bash
# Development with auto-reload
npm run dev

# Production mode
npm start

# Check logs
tail -f logs/combined.log

# Test health endpoint
curl http://localhost:8000/api/health
```

## 📋 Troubleshooting

### "Environment variable validation failed"
→ Check your `.env` file has all required variables

### "Database connection error"
→ Verify `DATABASE_URL` is correct and database is accessible

### "Port 8000 already in use"
→ Change `PORT` in `.env` or kill the process using port 8000

### "CORS error from frontend"
→ Add your frontend URL to `ALLOWED_ORIGINS` in `.env`

## ✅ Next Steps

1. ✅ Server running locally
2. 📖 Read [README.md](./README.md) for full documentation
3. 🚀 See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
4. 🧪 Test all endpoints using the examples in README

## 🔗 Important Endpoints

- **API Root:** http://localhost:8000/api
- **Health Check:** http://localhost:8000/api/health
- **Sign Up:** POST http://localhost:8000/api/auth/sign-up/email
- **Sign In:** POST http://localhost:8000/api/auth/sign-in/email
- **Get Profile:** GET http://localhost:8000/api/user/profile (requires auth)

## 💡 Tips

- Use Postman/Insomnia for easier testing
- Enable "Send cookies automatically" in your HTTP client
- Check server logs if something doesn't work
- All auth endpoints are rate-limited (5 req/15min)

---

**Need Help?** Check README.md for detailed documentation.
