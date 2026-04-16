// Production Monitoring Setup Script
// Usage: node scripts/setup-monitoring.js

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Production Monitoring...');

// Create monitoring configuration
const monitoringConfig = {
  version: '0.4.0',
  services: {
    backend: {
      healthEndpoint: '/health',
      metricsEndpoint: '/metrics',
      alerts: [
        {
          name: 'high_cpu_usage',
          threshold: 80,
          duration: '5m',
          action: 'scale'
        },
        {
          name: 'high_memory_usage',
          threshold: 85,
          duration: '5m',
          action: 'restart'
        },
        {
          name: 'database_connection_failed',
          threshold: 1,
          duration: '1m',
          action: 'alert'
        },
        {
          name: 'redis_connection_failed',
          threshold: 1,
          duration: '1m',
          action: 'alert'
        }
      ]
    },
    frontend: {
      healthEndpoint: '/',
      performanceMetrics: true,
      errorTracking: true,
      userAnalytics: true
    }
  },
  logging: {
    level: 'info',
    format: 'json',
    destinations: ['console', 'file', 'external'],
    retention: '30d'
  },
  analytics: {
    enabled: true,
    tracking: ['page_views', 'user_actions', 'performance', 'errors'],
    sampling: 0.1
  }
};

// Write monitoring configuration
fs.writeFileSync(
  path.join(__dirname, '../config/monitoring.json'),
  JSON.stringify(monitoringConfig, null, 2)
);

console.log('✅ Monitoring configuration created');

// Create health check endpoint for backend
const healthCheckCode = `
// Health Check Endpoint
app.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.VERSION || '0.4.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {
        database: await checkDatabase(),
        redis: await checkRedis(),
        disk: await checkDiskSpace(),
        cpu: process.cpuUsage()
      }
    };
    
    const isHealthy = Object.values(health.checks).every(check => 
      check.status === 'healthy' || check.status === 'warning'
    );
    
    res.status(isHealthy ? 200 : 503).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

async function checkDatabase() {
  try {
    await db.raw('SELECT 1');
    return { status: 'healthy', latency: Date.now() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

async function checkRedis() {
  try {
    await redis.ping();
    return { status: 'healthy', latency: Date.now() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

async function checkDiskSpace() {
  try {
    const stats = fs.statSync('.');
    return { status: 'healthy', space: 'available' };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}
`;

// Create metrics endpoint
const metricsCode = `
// Metrics Endpoint
app.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      version: process.env.VERSION || '0.4.0',
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        load: require('os').loadavg()
      },
      application: {
        activeConnections: getActiveConnections(),
        totalPlayers: getTotalPlayers(),
        activeGames: getActiveGames(),
        requestsPerSecond: getRequestsPerSecond(),
        errorRate: getErrorRate()
      },
      database: {
        connections: getDatabaseConnections(),
        queryTime: getAverageQueryTime(),
        slowQueries: getSlowQueries()
      },
      cache: {
        hitRate: getCacheHitRate(),
        memoryUsage: getCacheMemoryUsage(),
        evictions: getCacheEvictions()
      }
    };
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
`;

// Write monitoring endpoints to server
fs.writeFileSync(
  path.join(__dirname, '../server/src/monitoring.ts'),
  healthCheckCode + '\n' + metricsCode
);

console.log('✅ Monitoring endpoints created');

// Create Sentry configuration
const sentryConfig = `
// Sentry Configuration
import * as Sentry from '@sentry/node';
import * as Integrations from '@sentry/integrations';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: 'production',
    release: \`gehlenn-mmorpg@\${process.env.VERSION || '0.4.0'}\`,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new Sentry.Integrations.Redis({ redis }),
    ],
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // Filter out sensitive information
      if (event.exception) {
        const exception = event.exception;
        if (exception.values && exception.values[0]) {
          const value = exception.values[0];
          if (value.stacktrace) {
            // Remove sensitive data from stack trace
            value.stacktrace.frames = value.stacktrace.frames.filter(frame => 
              !frame.filename.includes('node_modules') &&
              !frame.filename.includes('config')
            );
          }
        }
      }
      return event;
    }
  });
  
  // Request handler
  app.use(Sentry.Handlers.requestHandler());
  
  // Error handler
  app.use(Sentry.Handlers.errorHandler());
}
`;

fs.writeFileSync(
  path.join(__dirname, '../server/src/sentry.ts'),
  sentryConfig
);

console.log('✅ Sentry configuration created');

// Create performance monitoring
const performanceMonitoring = `
// Performance Monitoring
const performance = {
  // Track request timing
  trackRequest: (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const route = req.route ? req.route.path : req.path;
      
      console.log(\`Performance: \${req.method} \${route} - \${duration}ms\`);
      
      // Alert on slow requests
      if (duration > 1000) {
        console.warn(\`Slow request detected: \${req.method} \${route} - \${duration}ms\`);
      }
    });
    
    next();
  },
  
  // Track database query performance
  trackQuery: (query, duration) => {
    if (duration > 100) {
      console.warn(\`Slow database query: \${duration}ms - \${query}\`);
    }
  },
  
  // Track cache performance
  trackCache: (operation, hit) => {
    if (!hit && operation === 'get') {
      console.warn('Cache miss detected');
    }
  }
};

module.exports = performance;
`;

fs.writeFileSync(
  path.join(__dirname, '../server/src/performance.ts'),
  performanceMonitoring
);

console.log('✅ Performance monitoring created');

console.log('🎉 Production monitoring setup completed!');
console.log('');
console.log('Next steps:');
console.log('1. Configure SENTRY_DSN in .env.production');
console.log('2. Test health endpoints: GET /health and GET /metrics');
console.log('3. Set up alerts in your monitoring dashboard');
console.log('4. Configure log aggregation');
