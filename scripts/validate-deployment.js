// Deployment Validation Script for v0.4.0 Transition
// Usage: node scripts/validate-deployment.js

const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🔍 Starting Deployment Validation for v0.4.0...\n');

// Configuration
const config = {
  backendUrl: process.env.BACKEND_URL || 'https://your-backend.railway.app',
  frontendUrl: process.env.FRONTEND_URL || 'https://your-frontend.vercel.app',
  supabaseUrl: process.env.SUPABASE_URL,
  redisUrl: process.env.REDIS_URL,
  timeout: 10000,
  retries: 3
};

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(config.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Validation functions
async function validateBackendHealth() {
  colorLog('blue', '🔧 Validating backend health...');
  
  try {
    const response = await makeRequest(`${config.backendUrl}/health`);
    
    if (response.status === 200) {
      const health = JSON.parse(response.data);
      
      colorLog('green', `✅ Backend healthy (${health.version || 'unknown'})`);
      colorLog('blue', `   Uptime: ${Math.round(health.uptime || 0)}s`);
      colorLog('blue', `   Status: ${health.status || 'unknown'}`);
      
      // Validate health checks
      if (health.checks) {
        const checks = Object.entries(health.checks);
        for (const [name, check] of checks) {
          const status = check.status || 'unknown';
          const icon = status === 'healthy' ? '✅' : status === 'warning' ? '⚠️' : '❌';
          colorLog(status === 'healthy' ? 'green' : status === 'warning' ? 'yellow' : 'red', `   ${icon} ${name}: ${status}`);
        }
      }
      
      return true;
    } else {
      colorLog('red', `❌ Backend unhealthy (HTTP ${response.status})`);
      return false;
    }
    
  } catch (error) {
    colorLog('red', `❌ Backend health check failed: ${error.message}`);
    return false;
  }
}

async function validateBackendAPI() {
  colorLog('blue', '🔌 Validating backend API...');
  
  const endpoints = [
    '/api/v1/status',
    '/api/v1/users',
    '/api/v1/characters',
    '/api/v1/world'
  ];
  
  let success = true;
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${config.backendUrl}${endpoint}`);
      
      if (response.status < 500) {
        colorLog('green', `✅ ${endpoint} (${response.status})`);
      } else {
        colorLog('red', `❌ ${endpoint} (${response.status})`);
        success = false;
      }
      
    } catch (error) {
      colorLog('red', `❌ ${endpoint} failed: ${error.message}`);
      success = false;
    }
  }
  
  return success;
}

async function validateFrontendHealth() {
  colorLog('blue', '🌐 Validating frontend health...');
  
  try {
    const response = await makeRequest(config.frontendUrl);
    
    if (response.status === 200) {
      colorLog('green', `✅ Frontend healthy`);
      
      // Check for key elements in HTML
      const html = response.data.toLowerCase();
      const checks = [
        { name: 'Game container', pattern: '<div id="game"' },
        { name: 'Login system', pattern: 'login' },
        { name: 'Character selection', pattern: 'character' },
        { name: 'Game assets', pattern: 'assets' }
      ];
      
      for (const check of checks) {
        if (html.includes(check.pattern)) {
          colorLog('green', `   ✅ ${check.name}`);
        } else {
          colorLog('yellow', `   ⚠️  ${check.name} not found`);
        }
      }
      
      return true;
    } else {
      colorLog('red', `❌ Frontend unhealthy (HTTP ${response.status})`);
      return false;
    }
    
  } catch (error) {
    colorLog('red', `❌ Frontend health check failed: ${error.message}`);
    return false;
  }
}

async function validateDatabaseConnection() {
  colorLog('blue', '🗄️  Validating database connection...');
  
  if (!config.supabaseUrl) {
    colorLog('yellow', '⚠️  Supabase URL not configured');
    return false;
  }
  
  try {
    // Test Supabase connection
    const response = await makeRequest(`${config.supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || ''}`
      }
    });
    
    if (response.status === 200) {
      colorLog('green', '✅ Database connection successful');
      return true;
    } else {
      colorLog('red', `❌ Database connection failed (HTTP ${response.status})`);
      return false;
    }
    
  } catch (error) {
    colorLog('red', `❌ Database validation failed: ${error.message}`);
    return false;
  }
}

async function validateRedisConnection() {
  colorLog('blue', '🔴 Validating Redis connection...');
  
  if (!config.redisUrl) {
    colorLog('yellow', '⚠️  Redis URL not configured');
    return false;
  }
  
  // For Redis, we'd typically use a Redis client
  // For this validation, we'll just check if the URL is properly formatted
  try {
    const url = new URL(config.redisUrl);
    
    if (url.protocol === 'redis:' && url.hostname) {
      colorLog('green', '✅ Redis URL format valid');
      colorLog('blue', `   Host: ${url.hostname}`);
      colorLog('blue', `   Port: ${url.port || '6379'}`);
      return true;
    } else {
      colorLog('red', '❌ Invalid Redis URL format');
      return false;
    }
    
  } catch (error) {
    colorLog('red', `❌ Redis validation failed: ${error.message}`);
    return false;
  }
}

async function validatePerformance() {
  colorLog('blue', '⚡ Validating performance...');
  
  const tests = [
    {
      name: 'Backend response time',
      url: `${config.backendUrl}/health`,
      maxTime: 1000
    },
    {
      name: 'Frontend load time',
      url: config.frontendUrl,
      maxTime: 3000
    }
  ];
  
  let success = true;
  
  for (const test of tests) {
    const startTime = Date.now();
    
    try {
      await makeRequest(test.url);
      const responseTime = Date.now() - startTime;
      
      if (responseTime <= test.maxTime) {
        colorLog('green', `✅ ${test.name}: ${responseTime}ms`);
      } else {
        colorLog('yellow', `⚠️  ${test.name}: ${responseTime}ms (slow)`);
        success = false;
      }
      
    } catch (error) {
      colorLog('red', `❌ ${test.name} failed: ${error.message}`);
      success = false;
    }
  }
  
  return success;
}

async function validateSecurity() {
  colorLog('blue', '🔒 Validating security...');
  
  const tests = [
    {
      name: 'HTTPS enforcement',
      url: config.frontendUrl,
      check: (response) => response.request?.protocol === 'https:'
    },
    {
      name: 'Security headers',
      url: config.frontendUrl,
      check: (response) => {
        const headers = response.headers || {};
        return headers['x-frame-options'] || headers['x-content-type-options'];
      }
    },
    {
      name: 'CORS configuration',
      url: `${config.backendUrl}/health`,
      check: (response) => {
        const headers = response.headers || {};
        return headers['access-control-allow-origin'];
      }
    }
  ];
  
  let success = true;
  
  for (const test of tests) {
    try {
      const response = await makeRequest(test.url);
      const passed = test.check(response);
      
      if (passed) {
        colorLog('green', `✅ ${test.name}`);
      } else {
        colorLog('yellow', `⚠️  ${test.name} - not properly configured`);
        success = false;
      }
      
    } catch (error) {
      colorLog('red', `❌ ${test.name} failed: ${error.message}`);
      success = false;
    }
  }
  
  return success;
}

function validateEnvironment() {
  colorLog('blue', '🔍 Validating environment configuration...');
  
  const required = [
    'BACKEND_URL',
    'FRONTEND_URL',
    'SUPABASE_URL',
    'REDIS_URL'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length === 0) {
    colorLog('green', '✅ Environment variables configured');
    return true;
  } else {
    colorLog('yellow', `⚠️  Missing environment variables: ${missing.join(', ')}`);
    return false;
  }
}

function generateReport(results) {
  colorLog('magenta', '\n📊 Deployment Validation Report');
  colorLog('magenta', '===============================');
  
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    version: '0.4.0',
    environment: {
      backend: config.backendUrl,
      frontend: config.frontendUrl,
      supabase: config.supabaseUrl,
      redis: config.redisUrl ? 'configured' : 'not configured'
    },
    results,
    summary: {
      passed: results.filter(r => r.status).length,
      failed: results.filter(r => !r.status).length,
      total: results.length
    }
  };
  
  // Save report
  const reportPath = path.join(__dirname, '../reports', `deployment-validation-${timestamp.replace(/[:.]/g, '-')}.json`);
  
  // Ensure reports directory exists
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  colorLog('green', `✅ Report saved: ${reportPath}`);
  
  // Display summary
  colorLog('magenta', `\nSummary: ${report.summary.passed}/${report.summary.total} checks passed`);
  
  if (report.summary.failed > 0) {
    colorLog('red', '\n❌ Some validation checks failed. Please review before going live.');
    return false;
  } else {
    colorLog('green', '\n🎉 All validation checks passed! Deployment is ready for production.');
    return true;
  }
}

// Main execution
async function main() {
  const results = [];
  
  try {
    // Run all validation checks
    results.push({
      test: 'Environment Configuration',
      status: validateEnvironment()
    });
    
    results.push({
      test: 'Backend Health',
      status: await validateBackendHealth()
    });
    
    results.push({
      test: 'Backend API',
      status: await validateBackendAPI()
    });
    
    results.push({
      test: 'Frontend Health',
      status: await validateFrontendHealth()
    });
    
    results.push({
      test: 'Database Connection',
      status: await validateDatabaseConnection()
    });
    
    results.push({
      test: 'Redis Connection',
      status: await validateRedisConnection()
    });
    
    results.push({
      test: 'Performance',
      status: await validatePerformance()
    });
    
    results.push({
      test: 'Security',
      status: await validateSecurity()
    });
    
    // Generate final report
    const success = generateReport(results);
    
    if (!success) {
      process.exit(1);
    }
    
  } catch (error) {
    colorLog('red', `❌ Validation error: ${error.message}`);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { main, config };
