# Production Deployment Checklist

Use this checklist to ensure your backend is properly configured before going live.

## 🔐 Security Configuration

### Environment Variables
- [ ] `BETTER_AUTH_SECRET` is 32+ random characters (not default value)
- [ ] `BETTER_AUTH_SECRET` generated with: `openssl rand -base64 32`
- [ ] `DATABASE_URL` uses HTTPS/SSL (includes `?sslmode=require`)
- [ ] `DATABASE_URL` uses pooled connection (ends with `-pooler` for Neon)
- [ ] `BETTER_AUTH_URL` uses HTTPS (not HTTP)
- [ ] `FRONTEND_URL` uses HTTPS (not HTTP)
- [ ] `NODE_ENV=production` is set
- [ ] All URLs match actual deployment domains (no localhost)

### CORS & Origins
- [ ] `ALLOWED_ORIGINS` includes all production frontend domains
- [ ] CORS tested with actual frontend (not just API client)
- [ ] Subdomains included if needed (www., app., etc.)
- [ ] Protocol matches exactly (https:// vs http://)

### Rate Limiting
- [ ] Rate limits are appropriate for your traffic
- [ ] Auth endpoints limited to 5 req/15min (or custom value)
- [ ] API endpoints limited to 100 req/15min (or custom value)
- [ ] Tested that rate limiting works

## 🗄️ Database Configuration

### Connection
- [ ] Database is accessible from deployment environment
- [ ] SSL/TLS is enabled and enforced
- [ ] Using pooled connection string for serverless
- [ ] Connection timeout configured (5 seconds)
- [ ] Idle timeout configured (30 seconds)

### Migrations
- [ ] `001_better_auth_core.sql` executed successfully
- [ ] `002_user_profiles.sql` executed successfully
- [ ] All tables created: `user`, `session`, `account`, `verification`, `user_profiles`
- [ ] Indexes created properly
- [ ] Sample signup tested successfully

### Backup & Recovery
- [ ] Database backups configured (daily minimum)
- [ ] Backup retention policy set (30 days minimum)
- [ ] Tested restore procedure
- [ ] Have rollback plan

## 🚀 Deployment Configuration

### Platform Setup
- [ ] Deployment platform selected (Vercel/Railway/AWS/etc.)
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate configured and valid
- [ ] Environment variables set in deployment platform
- [ ] Region selected (close to users)

### Build & Deploy
- [ ] `npm install` runs successfully
- [ ] No build errors or warnings
- [ ] All dependencies installed correctly
- [ ] `node --check` passes on all .mjs files
- [ ] Deployment successful

### Verification
- [ ] Health endpoint responds: `GET /api/health`
- [ ] Root endpoint responds: `GET /`
- [ ] API documentation accessible: `GET /api`
- [ ] 404 handler works for invalid routes
- [ ] Error responses are properly formatted

## 🧪 Functionality Testing

### Authentication Flow
- [ ] Sign up with email/password works
- [ ] Sign in with existing user works
- [ ] Session cookie is set correctly
- [ ] Session persists across requests
- [ ] Sign out works and clears session
- [ ] Invalid credentials rejected properly

### Protected Endpoints
- [ ] `GET /api/user/profile` requires authentication
- [ ] `PUT /api/user/profile` requires authentication
- [ ] `POST /api/personalize` requires authentication
- [ ] `POST /api/chat` requires authentication
- [ ] All return 401 when not authenticated

### User Profile
- [ ] Profile created on signup (if profile fields provided)
- [ ] `GET /api/user/profile` returns correct data
- [ ] `PUT /api/user/profile` updates database
- [ ] Profile fields properly stored and retrieved

### Error Handling
- [ ] Invalid requests return 400 with error message
- [ ] Unauthorized requests return 401
- [ ] Not found returns 404
- [ ] Server errors return 500 (without exposing details)
- [ ] Rate limit exceeded returns 429

## 🔒 Security Testing

### Headers
- [ ] `X-Frame-Options: DENY` present
- [ ] `X-Content-Type-Options: nosniff` present
- [ ] `Strict-Transport-Security` present (HTTPS only)
- [ ] `Content-Security-Policy` configured
- [ ] XSS filter enabled

### Rate Limiting
- [ ] Auth endpoints limited (test with 6+ rapid requests)
- [ ] Returns 429 after exceeding limit
- [ ] `Retry-After` header present
- [ ] Rate limit resets after window

### CORS
- [ ] Requests from allowed origin succeed
- [ ] Requests from disallowed origin blocked
- [ ] Credentials (cookies) work with CORS
- [ ] Preflight OPTIONS requests handled

### SQL Injection
- [ ] All queries use parameterized statements
- [ ] No raw SQL concatenation
- [ ] Special characters in input handled safely

## 📊 Monitoring & Logging

### Logging
- [ ] Logs are being generated
- [ ] Log level set appropriately (`info` or `warn` for production)
- [ ] Sensitive data not logged (passwords, tokens)
- [ ] Request/response logging working
- [ ] Error logging captures stack traces

### Log Aggregation (Optional but Recommended)
- [ ] Logs sent to aggregator (Logtail, Datadog, etc.)
- [ ] Log search/filtering tested
- [ ] Log retention configured

### Error Tracking (Recommended)
- [ ] Sentry or similar configured
- [ ] Errors being captured
- [ ] Alerts set up for critical errors
- [ ] Error grouping working

### Uptime Monitoring
- [ ] Health check monitored (UptimeRobot, etc.)
- [ ] Alert configured for downtime
- [ ] Check interval set (5 minutes recommended)
- [ ] Notification method configured (email/SMS)

## 🎯 Performance

### Response Times
- [ ] Health check < 500ms
- [ ] Authentication < 1s
- [ ] Profile fetch < 500ms
- [ ] Database queries < 200ms

### Load Testing (Optional)
- [ ] Tested with expected concurrent users
- [ ] No connection pool exhaustion
- [ ] Response times stable under load
- [ ] Error rate acceptable

### Database Performance
- [ ] Indexes are being used (check query plans)
- [ ] No slow queries (check logs)
- [ ] Connection pooling working correctly

## 📚 Documentation

### Internal
- [ ] README.md reviewed and accurate
- [ ] API endpoints documented
- [ ] Environment variables documented
- [ ] Deployment process documented

### Team Knowledge
- [ ] Team knows where to find logs
- [ ] Team knows how to check database
- [ ] Team knows rollback procedure
- [ ] Team has access to deployment platform

## 🔄 Maintenance & Operations

### Access Control
- [ ] Limited number of people have production access
- [ ] Production credentials secured (not in code)
- [ ] Database admin credentials secured
- [ ] API keys stored securely

### Backup Plan
- [ ] Database backup tested
- [ ] Rollback procedure documented
- [ ] Previous version available if needed
- [ ] Downtime communication plan ready

### Scaling Plan
- [ ] Know how to scale if traffic increases
- [ ] Database can handle increased load
- [ ] Cost projections for scaling

## ⚠️ Pre-Launch Final Checks

**24 Hours Before Launch:**
- [ ] All above items checked
- [ ] Staging environment tested thoroughly
- [ ] Load testing completed (if applicable)
- [ ] Team briefed on launch plan

**1 Hour Before Launch:**
- [ ] Database backed up
- [ ] Previous version tagged for rollback
- [ ] Monitoring alerts active
- [ ] Team ready to respond

**At Launch:**
- [ ] Deploy to production
- [ ] Verify health check
- [ ] Test authentication flow
- [ ] Monitor logs for errors
- [ ] Test from actual frontend

**After Launch (First 24 Hours):**
- [ ] Monitor error rates
- [ ] Check response times
- [ ] Review logs for issues
- [ ] Verify user signups working
- [ ] Check database performance

## ✅ Sign-Off

Once all items are checked:

- [ ] Technical lead approval
- [ ] Security review completed
- [ ] Documentation complete
- [ ] Team trained
- [ ] Ready for production traffic

---

## 🚨 Emergency Contacts

Document your emergency contacts:

**Technical Lead:** _________________
**DevOps:** _________________
**Database Admin:** _________________
**On-Call Rotation:** _________________

**Rollback Command:** _________________
**Logs Location:** _________________
**Monitoring Dashboard:** _________________

---

## 📞 When Things Go Wrong

If production issues occur:

1. **Check health endpoint** - Is service running?
2. **Check logs** - What errors are occurring?
3. **Check database** - Can you connect?
4. **Check monitoring** - When did it start?
5. **Rollback if needed** - Previous version
6. **Communicate** - Update team/users
7. **Fix and redeploy** - With proper testing

---

**Ready to deploy?** Make sure every checkbox above is checked!

**Last Updated:** 2024-12-23
