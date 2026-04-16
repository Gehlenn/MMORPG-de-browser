# Production Setup Guide - Gehlenn MMORPG v0.4.0

## Overview

This guide covers the complete production environment setup for Gehlenn MMORPG v0.4.0 deployment using zero-cost services.

## Services Used

- **Database**: Supabase (PostgreSQL)
- **Backend**: Railway (Node.js)
- **Frontend**: Vercel (Static Hosting)
- **Cache**: Redis Cloud (Redis)
- **Monitoring**: Sentry + Custom
- **CI/CD**: GitHub Actions

## Prerequisites

1. Node.js 18+
2. Docker & Docker Compose
3. Git
4. Accounts on all services above

## Setup Steps

### 1. Environment Variables

Copy the environment template:
```bash
cp .env.example .env.production
```

Configure all variables in `.env.production`:
- Database credentials
- API keys
- Service URLs
- Security secrets

### 2. Database Setup (Supabase)

1. Create new project at https://supabase.com
2. Get connection string and API keys
3. Update `.env.production` with Supabase values
4. Run migrations:
```bash
npm run setup:database
```

### 3. Cache Setup (Redis Cloud)

1. Create free tier at https://redis.cloud
2. Get connection string
3. Update `REDIS_URL` in `.env.production`

### 4. Backend Deployment (Railway)

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and deploy:
```bash
railway login
cd server
railway deploy
```

3. Configure environment variables in Railway dashboard
4. Get backend URL and update `.env.production`

### 5. Frontend Deployment (Vercel)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
cd client
vercel --prod
```

3. Configure environment variables in Vercel dashboard
4. Update CORS settings

### 6. Monitoring Setup

1. Create Sentry project at https://sentry.io
2. Update `SENTRY_DSN` in `.env.production`
3. Run monitoring setup:
```bash
node scripts/setup-monitoring.js
```

### 7. Automated Deployment

Run the complete deployment script:
```bash
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh
```

## Configuration Files

- `.env.production` - Production environment variables
- `docker-compose.production.yml` - Production Docker setup
- `railway.toml` - Railway configuration
- `vercel.json` - Vercel configuration
- `server/Dockerfile.production` - Backend Dockerfile
- `client/Dockerfile.production` - Frontend Dockerfile

## Health Checks

Production endpoints:
- Backend Health: `GET /health`
- Metrics: `GET /metrics`
- Frontend: `GET /`

## Security Configuration

1. HTTPS enforced on all services
2. CORS properly configured
3. Environment variables secured
4. API rate limiting enabled
5. Security headers configured

## Performance Optimization

1. CDN enabled via Vercel
2. Redis caching implemented
3. Database queries optimized
4. Static assets compressed
5. Browser caching configured

## Monitoring & Alerts

1. Application errors tracked via Sentry
2. Performance metrics collected
3. Health checks automated
4. Custom alerts configured
5. Log aggregation enabled

## Scaling

The current setup supports:
- **Frontend**: Unlimited (Vercel CDN)
- **Backend**: Auto-scaling (Railway)
- **Database**: 500MB (Supabase free tier)
- **Cache**: 30MB (Redis Cloud free tier)

## Backup Strategy

1. Database: Daily automatic backups (Supabase)
2. Code: Version control (Git)
3. Assets: CDN replication
4. Config: Environment versioning

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check connection string format
   - Verify Supabase project status
   - Confirm IP whitelist settings

2. **CORS Errors**
   - Update CORS_ORIGIN in backend
   - Verify frontend URL in Vercel
   - Check preflight requests

3. **Cache Connection Failed**
   - Verify Redis Cloud credentials
   - Check connection string format
   - Confirm Redis cluster status

4. **Deployment Failed**
   - Check environment variables
   - Verify build process
   - Review service logs

### Debug Commands

```bash
# Check backend health
curl https://your-backend.railway.app/health

# Check frontend
curl https://your-frontend.vercel.app

# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Test Redis connection
redis-cli -u $REDIS_URL ping
```

## Rollback Plan

1. **Database**: Restore from automatic backup
2. **Backend**: Deploy previous version via Railway
3. **Frontend**: Deploy previous version via Vercel
4. **Cache**: Clear cache and restart

## Next Steps

After production setup:
1. Run smoke tests
2. Monitor performance metrics
3. Set up alerting
4. Prepare beta launch
5. Document production URLs

## Support

For issues:
1. Check service status pages
2. Review deployment logs
3. Consult this guide
4. Contact service providers

---

**Version**: 0.4.0  
**Last Updated**: 2026-03-19  
**Environment**: Production
