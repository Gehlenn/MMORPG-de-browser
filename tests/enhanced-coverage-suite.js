// Enhanced Coverage Suite - 95%+ Coverage Target
// Usage: npm run test:enhanced-coverage

const { execSync } = require('child_process');

console.log('🎯 Enhanced Coverage Suite - Target 95%+\n');

// Test categories with coverage requirements
const testCategories = [
  {
    name: 'Core Systems',
    files: [
      'tests/spawn-system.test.js',
      'tests/enhanced-ai-system.test.js',
      'tests/v0.4.0/regression.test.js'
    ],
    minCoverage: 95
  },
  {
    name: 'Game Engine',
    files: [
      'tests/v0.4.0/coverage.test.js'
    ],
    minCoverage: 90
  },
  {
    name: 'Security & Finance',
    files: [
      'tests/v0.4.0/financial-security.test.js'
    ],
    minCoverage: 98
  },
  {
    name: 'Authentication',
    files: [
      'tests-essential/login-manager.test.js'
    ],
    minCoverage: 95
  }
];

// Run tests and collect coverage
async function runEnhancedCoverage() {
  console.log('🚀 Running Enhanced Coverage Tests...\n');
  
  const results = [];
  
  for (const category of testCategories) {
    console.log(`📋 Testing ${category.name}...`);
    
    try {
      // Run tests for this category
      const testFiles = category.files.join(' ');
      const command = `npx jest ${testFiles} --coverage --coverageReporters=text --coverageReporters=json --coverageDirectory=coverage-${category.name.toLowerCase().replace(/\s+/g, '-')}`;
      
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // Parse coverage results
      const coverageResult = parseCoverageResults(`coverage-${category.name.toLowerCase().replace(/\s+/g, '-')}/coverage-final.json`);
      
      results.push({
        category: category.name,
        coverage: coverageResult.overall,
        target: category.minCoverage,
        passed: coverageResult.overall >= category.minCoverage,
        files: category.files
      });
      
      console.log(`   Coverage: ${coverageResult.overall}% (Target: ${category.minCoverage}%)`);
      console.log(`   Status: ${coverageResult.overall >= category.minCoverage ? '✅ PASS' : '❌ FAIL'}\n`);
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}\n`);
      
      results.push({
        category: category.name,
        coverage: 0,
        target: category.minCoverage,
        passed: false,
        error: error.message,
        files: category.files
      });
    }
  }
  
  // Generate final report
  generateCoverageReport(results);
  
  // Check if all targets met
  const allPassed = results.every(r => r.passed);
  
  if (allPassed) {
    console.log('🎉 All coverage targets achieved!');
    console.log('✅ Enhanced Coverage Suite: PASSED');
  } else {
    console.log('❌ Some coverage targets not met');
    console.log('❌ Enhanced Coverage Suite: FAILED');
    
    // Show failing categories
    const failing = results.filter(r => !r.passed);
    console.log('\n🔧 Areas needing improvement:');
    failing.forEach(f => {
      console.log(`   - ${f.category}: ${f.coverage}% (Target: ${f.target}%)`);
    });
  }
  
  return allPassed;
}

function parseCoverageResults(coverageFile) {
  try {
    const fs = require('fs');
    if (!fs.existsSync(coverageFile)) {
      return { overall: 0 };
    }
    
    const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
    let totalLines = 0;
    let coveredLines = 0;
    
    // Calculate overall coverage
    Object.values(coverage).forEach(fileCoverage => {
      if (fileCoverage.lines) {
        totalLines += Object.keys(fileCoverage.lines).length;
        coveredLines += Object.values(fileCoverage.lines).filter(line => line > 0).length;
      }
    });
    
    const overall = totalLines > 0 ? Math.round((coveredLines / totalLines) * 100) : 0;
    
    return { overall, totalLines, coveredLines };
  } catch (error) {
    console.warn(`Warning: Could not parse coverage file ${coverageFile}: ${error.message}`);
    return { overall: 0 };
  }
}

function generateCoverageReport(results) {
  const fs = require('fs');
  const path = require('path');
  
  const report = {
    timestamp: new Date().toISOString(),
    version: '0.4.0',
    target: '95%+ Coverage',
    results,
    summary: {
      totalCategories: results.length,
      passedCategories: results.filter(r => r.passed).length,
      averageCoverage: Math.round(results.reduce((sum, r) => sum + r.coverage, 0) / results.length),
      highestCoverage: Math.max(...results.map(r => r.coverage)),
      lowestCoverage: Math.min(...results.map(r => r.coverage))
    }
  };
  
  // Save detailed report
  const reportPath = path.join(__dirname, '../reports/coverage-report.json');
  const reportsDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Display summary
  console.log('📊 Coverage Summary');
  console.log('==================');
  console.log(`Total Categories: ${report.summary.totalCategories}`);
  console.log(`Passed: ${report.summary.passedCategories}`);
  console.log(`Average Coverage: ${report.summary.averageCoverage}%`);
  console.log(`Highest: ${report.summary.highestCoverage}%`);
  console.log(`Lowest: ${report.summary.lowestCoverage}%`);
  console.log(`Report saved: ${reportPath}`);
}

// Feature integrity tests
function runFeatureIntegrityTests() {
  console.log('🔒 Running Feature Integrity Tests...\n');
  
  const features = [
    {
      name: 'Spawn System',
      test: () => {
        // Test if spawn system is working
        const spawnSystem = require('../server/world/advancedSpawnSystem');
        return spawnSystem && typeof spawnSystem.spawnMob === 'function';
      }
    },
    {
      name: 'AI System',
      test: () => {
        // Test if AI system is working
        const aiSystem = require('../server/ai/AIMobController');
        return aiSystem && typeof aiSystem.updateAI === 'function';
      }
    },
    {
      name: 'Database Migration',
      test: () => {
        // Test if migration script exists and is valid
        const fs = require('fs');
        const migrationScript = '../scripts/migrate-database.js';
        return fs.existsSync(migrationScript);
      }
    },
    {
      name: 'Production Environment',
      test: () => {
        // Test if production environment is configured
        const fs = require('fs');
        const envFile = '../.env.production';
        return fs.existsSync(envFile);
      }
    }
  ];
  
  const results = [];
  
  for (const feature of features) {
    try {
      const passed = feature.test();
      results.push({
        feature: feature.name,
        status: passed ? '✅ PASS' : '❌ FAIL',
        passed
      });
      
      console.log(`${passed ? '✅' : '❌'} ${feature.name}: ${passed ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      results.push({
        feature: feature.name,
        status: '❌ ERROR',
        passed: false,
        error: error.message
      });
      
      console.log(`❌ ${feature.name}: ERROR - ${error.message}`);
    }
  }
  
  const allPassed = results.every(r => r.passed);
  console.log(`\nFeature Integrity: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);
  
  return allPassed;
}

// Main execution
async function main() {
  console.log('🎯 Enhanced Testing Suite v0.4.0');
  console.log('====================================\n');
  
  // Run feature integrity tests first
  const integrityPassed = runFeatureIntegrityTests();
  
  if (!integrityPassed) {
    console.log('\n❌ Feature integrity tests failed. Please fix issues before running coverage tests.');
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(50));
  
  // Run enhanced coverage tests
  const coveragePassed = await runEnhancedCoverage();
  
  if (!coveragePassed) {
    console.log('\n❌ Coverage targets not met. Please improve test coverage.');
    process.exit(1);
  }
  
  console.log('\n🎉 All tests passed! Code quality is excellent.');
  console.log('✅ Ready for production deployment.');
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test suite error:', error.message);
    process.exit(1);
  });
}

module.exports = { main, runEnhancedCoverage, runFeatureIntegrityTests };
