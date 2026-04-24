/**
 * deploy.config.js
 * Configuração de deploy para produção
 * Legacy of Komodo v0.6.0 - Nível 10
 */

module.exports = {
  // Versão
  version: '0.6.0',
  codename: 'Nível 10',
  
  // Ambiente
  environment: 'production',
  
  // Servidor
  server: {
    host: process.env.SERVER_HOST || '0.0.0.0',
    port: process.env.PORT || 3000,
    ssl: true,
    cors: {
      origin: [
        'https://legacyofkomodo.com',
        'https://www.legacyofkomodo.com',
        'https://m.legacyofkomodo.com'
      ],
      credentials: true
    }
  },
  
  // Database
  database: {
    pool: {
      min: 5,
      max: 20,
      acquire: 30000,
      idle: 10000
    },
    backups: {
      enabled: true,
      interval: '0 0 * * *', // Daily at midnight
      retention: 30 // days
    }
  },
  
  // Redis Cache
  redis: {
    enabled: true,
    ttl: 3600, // 1 hour
    max: 100 // max keys
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    skipSuccessfulRequests: false
  },
  
  // WebSocket
  websocket: {
    pingInterval: 30000, // 30s
    pingTimeout: 5000, // 5s
    maxConnections: 10000
  },
  
  // Logging
  logging: {
    level: 'info',
    file: 'logs/production.log',
    maxFiles: 10,
    maxSize: '100m'
  },
  
  // Monitoring
  monitoring: {
    enabled: true,
    interval: 60000, // 1 minute
    alerts: {
      cpu: 70,
      memory: 80,
      responseTime: 500,
      errorRate: 1
    }
  },
  
  // Features
  features: {
    seasonalEvents: true,
    advancedAI: true,
    mobileSupport: true,
    guildWars: false, // Coming in v0.6.2
    mounts: false // Coming in v0.6.1
  },
  
  // Build
  build: {
    client: {
      entry: 'client/index.html',
      output: 'dist/client',
      minify: true,
      sourceMap: false
    },
    server: {
      entry: 'server/server.js',
      output: 'dist/server',
      minify: true,
      sourceMap: false
    }
  }
};
