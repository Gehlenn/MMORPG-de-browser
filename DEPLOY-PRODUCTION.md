# Production Deployment Guide

**Version:** v0.4.0 "AI Vision"  
**Last Updated:** 2026-04-16  
**Status:** Production Ready ✅

---

## Overview

This guide covers deploying the Legacy of Komodo MMORPG v0.4.0 to production environments (Render, Railway, VPS, or dedicated server).

---

## Prerequisites

### System Requirements
- **OS:** Linux (Ubuntu 20.04+), Windows Server 2019+, or macOS 12+
- **Node.js:** 18.x LTS or higher
- **RAM:** 2GB minimum (4GB recommended for 100+ concurrent players)
- **CPU:** 2 cores minimum
- **Disk:** 10GB free space
- **Network:** Ports 80, 443, 3000 (or custom) open

### Software Requirements
```bash
Node.js >= 18.0.0
npm >= 9.0.0
Git
PM2 (recommended for process management)
```

---

## Deployment Options

### Option 1: Render (Recommended)

**Pros:** Free tier, automatic HTTPS, easy scaling  
**Cons:** Limited free hours per month

**Steps:**
1. Fork/push code to GitHub
2. Connect Render dashboard to repository
3. Create Web Service:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `NODE_ENV=production`
4. Set environment variables in Render dashboard
5. Deploy automatically triggers on git push

**Environment Variables:**
```
NODE_ENV=production
PORT=10000
VERSION=0.4.0
SOCKET_CORS_ORIGIN=*
LOG_LEVEL=info
```

---

### Option 2: Railway

**Pros:** Simple deployment, good free tier, automatic HTTPS  
**Cons:** Cold starts on free tier

**Steps:**
1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Link project: `railway link`
4. Set variables: `railway variables`
5. Deploy: `railway up`

**railway.toml:**
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

---

### Option 3: VPS / Dedicated Server

**Pros:** Full control, better performance, predictable costs  
**Cons:** Requires server management skills

**Recommended Providers:**
- DigitalOcean Droplet ($6-24/month)
- Linode ($5-20/month)
- Hetzner Cloud (€4.51-16.72/month)
- AWS EC2 t3.micro (free tier available)

**Deployment Steps:**

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

#### 2. Application Deployment
```bash
# Create app directory
mkdir -p /var/www/komodo
cd /var/www/komodo

# Clone repository
git clone https://github.com/yourusername/legacy-of-komodo.git .

# Install dependencies
npm ci --production

# Create environment file
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
VERSION=0.4.0
SOCKET_CORS_ORIGIN=*
LOG_LEVEL=info
AI_BROADCAST_INTERVAL=500
AI_MAX_ENTITIES=100
EOF

# Start with PM2
pm2 start server/server.js --name "komodo-v0.4.0" --env production

# Save PM2 config
pm2 save
pm2 startup systemd
```

#### 3. Nginx Reverse Proxy (Recommended)
```bash
# Install Nginx
sudo apt install -y nginx

# Create site config
sudo tee /etc/nginx/sites-available/komodo << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/komodo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install Certbot for HTTPS
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Post-Deployment Checklist

### Health Checks
- [ ] Server responds to HTTP requests
- [ ] WebSocket connections establish successfully
- [ ] Health endpoint returns 200 OK
- [ ] AI entities spawn correctly
- [ ] State broadcasts are received by clients

### Performance Verification
- [ ] Memory usage < 500MB at startup
- [ ] CPU usage < 10% at idle
- [ ] Latency < 100ms for local connections
- [ ] Can handle 50+ concurrent connections

### Feature Verification
- [ ] **Phase 2:** F9 debug overlay visible
- [ ] **Phase 2:** AI state colors display correctly
- [ ] **Phase 3:** Threat meter appears on attack
- [ ] **Phase 3:** Tactical tips show during combat
- [ ] **Phase 4:** FPS stays at 60 with 50+ mobs
- [ ] **Phase 4:** Network bandwidth < 5 KB/s per player

---

## Monitoring & Logging

### PM2 Monitoring
```bash
# View logs
pm2 logs komodo-v0.4.0

# Monitor resources
pm2 monit

# Restart application
pm2 restart komodo-v0.4.0

# View status
pm2 status
```

### Application Logs
Logs are written to:
- Console (stdout/stderr)
- `logs/` directory (if configured)
- PM2 logs: `~/.pm2/logs/`

### Key Metrics to Monitor
- **Player count:** Active concurrent connections
- **Memory usage:** Should stay < 1GB
- **CPU usage:** Should stay < 50%
- **AI entities:** Count of active mobs/bosses
- **Network I/O:** Bytes in/out per second
- **Event loop lag:** Should be < 50ms

---

## Rollback Procedure

If issues occur after deployment:

### Option 1: Git Rollback
```bash
# View previous commits
git log --oneline -10

# Rollback to previous version
git revert HEAD
# OR
git checkout <previous-commit-hash>

# Restart application
pm2 restart komodo-v0.4.0
```

### Option 2: PM2 Rollback
```bash
# List previous versions
pm2 save --force

# Restore from backup (if configured)
pm2 resurrect

# Or manually checkout previous deployment
cd /var/www/komodo-backup-<date>
pm2 start server/server.js --name "komodo-v0.4.0"
```

---

## Troubleshooting

### Issue: Server won't start
**Solutions:**
1. Check Node.js version: `node --version` (need 18+)
2. Check port availability: `lsof -i :3000`
3. Check environment variables are set
4. Review logs: `pm2 logs`

### Issue: WebSocket connections fail
**Solutions:**
1. Check firewall rules (ports 3000, 80, 443)
2. Verify SOCKET_CORS_ORIGIN setting
3. Check Nginx WebSocket proxy config
4. Test with `wscat`: `npm i -g wscat && wscat -c ws://localhost:3000`

### Issue: High memory usage
**Solutions:**
1. Reduce AI_MAX_ENTITIES
2. Enable PM2 cluster mode: `pm2 start server/server.js -i max`
3. Check for memory leaks in application code
4. Restart periodically: `pm2 restart komodo-v0.4.0 --cron "0 4 * * *"`

### Issue: Low FPS on client
**Solutions:**
1. Verify AIStatePool is being used
2. Check SpatialIndex is initialized
3. Reduce AI_BROADCAST_INTERVAL (increase to 1000ms)
4. Enable client-side frame skipping

---

## Security Considerations

### Environment Variables
**Never commit to git:**
- Database passwords
- JWT secrets
- API keys
- Admin credentials

### Recommended Security Headers
```javascript
// In server.js or middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});
```

### Rate Limiting
```bash
# Install rate limiting
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);
```

---

## Scaling Strategy

### Horizontal Scaling (Multiple Servers)
```
              ┌─────────────┐
   Players →  │   Load      │ → Server 1 (3000)
              │  Balancer   │ → Server 2 (3001)
              │   (Nginx)   │ → Server 3 (3002)
              └─────────────┘
```

**Requirements:**
- Redis for shared state
- Sticky sessions for WebSocket
- Database sharding (future)

### Vertical Scaling (Bigger Server)
**Current limits:**
- Single server: ~500 concurrent players
- Memory: 2-4GB for 100 players
- CPU: 2-4 cores recommended

**Upgrade path:**
- 100 players: 2GB RAM, 2 cores
- 500 players: 4GB RAM, 4 cores
- 1000+ players: Horizontal scaling required

---

## Support & Resources

### Documentation
- `README.md` - General project info
- `CHANGELOG-v0.4.0.md` - Release notes
- `.planning/phases/` - Phase documentation
- `QA-SIGNOFF-v0.4.0.md` - Quality assurance

### Commands Reference
```bash
# Deploy to staging
.\scripts\deploy-staging.ps1

# Start production server
npm start

# Monitor with PM2
pm2 monit
pm2 logs

# Restart
pm2 restart komodo-v0.4.0

# Update
npm update
pm2 restart komodo-v0.4.0
```

---

## Contact

**Issues:** Report on GitHub Issues  
**Discussions:** GitHub Discussions  
**Emergency:** Contact tech lead

---

**Version:** 0.4.0  
**Last Updated:** 2026-04-16  
**Status:** ✅ Production Ready

---

*This deployment guide ensures safe, reliable production deployment of the Legacy of Komodo v0.4.0 release.*
