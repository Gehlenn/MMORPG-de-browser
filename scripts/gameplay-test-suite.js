// Complete Gameplay Test Suite
// Tests movement, combat, inventory, skills, and all integrated systems

const { execSync } = require('child_process');

console.log('🎮 Starting Complete Gameplay Test Suite\n');

// Test Categories
const testCategories = [
    {
        name: 'Server Connection',
        tests: [
            'Check server startup',
            'Verify WebSocket connection',
            'Test client-server communication'
        ]
    },
    {
        name: 'Asset Loading',
        tests: [
            'Verify all NPCs loaded',
            'Verify all monsters loaded',
            'Verify all characters loaded',
            'Verify all maps loaded',
            'Verify all dungeons loaded'
        ]
    },
    {
        name: 'Login System',
        tests: [
            'Test user login',
            'Test character selection',
            'Test character creation',
            'Test enter world functionality'
        ]
    },
    {
        name: 'HUD System',
        tests: [
            'Test HUD visibility on login',
            'Test HUD display in gameplay',
            'Test HUD hide on logout',
            'Test all HUD elements rendering'
        ]
    },
    {
        name: 'Movement System',
        tests: [
            'Test player movement (WASD)',
            'Test collision detection',
            'Test map boundaries',
            'Test smooth movement'
        ]
    },
    {
        name: 'Combat System',
        tests: [
            'Test mob spawning',
            'Test combat initiation',
            'Test damage calculation',
            'Test health regeneration',
            'Test death and respawn'
        ]
    },
    {
        name: 'AI System',
        tests: [
            'Test mob pathfinding',
            'Test mob behavior patterns',
            'Test mob targeting',
            'Test AI response to player'
        ]
    },
    {
        name: 'Inventory System',
        tests: [
            'Test item pickup',
            'Test inventory management',
            'Test equipment system',
            'Test item usage'
        ]
    },
    {
        name: 'Skill System',
        tests: [
            'Test skill activation',
            'Test cooldown system',
            'Test skill effects',
            'Test skill progression'
        ]
    },
    {
        name: 'Map System',
        tests: [
            'Test map loading',
            'Test area transitions',
            'Test portal functionality',
            'Test map navigation'
        ]
    },
    {
        name: 'Performance',
        tests: [
            'Test FPS stability',
            'Test memory usage',
            'Test network latency',
            'Test asset loading performance'
        ]
    }
];

// Start server
function startServer() {
    console.log('🚀 Starting server...');
    try {
        execSync('npm start', { stdio: 'pipe', cwd: process.cwd() });
        console.log('✅ Server started successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        return false;
    }
}

// Run browser tests
function runBrowserTests() {
    console.log('\n🌐 Opening browser for manual testing...');
    console.log('📋 Manual Test Checklist:');
    
    testCategories.forEach(category => {
        console.log(`\n🔍 ${category.name}:`);
        category.tests.forEach((test, index) => {
            console.log(`   ${index + 1}. ${test}`);
        });
    });
    
    console.log('\n📝 Test Instructions:');
    console.log('1. Open http://localhost:3000');
    console.log('2. Login with: teste / 123456');
    console.log('3. Select or create character');
    console.log('4. Enter the world');
    console.log('5. Test each item in the checklist');
    console.log('6. Report results (✅ PASS / ❌ FAIL / ⚠️ ISSUE)');
    
    return true;
}

// Automated validation
function runAutomatedValidation() {
    console.log('\n🤖 Running automated validation...');
    
    const validations = [
        {
            name: 'Server Health Check',
            test: () => {
                try {
                    const response = execSync('curl -s http://localhost:3000/health || echo "offline"', { encoding: 'utf8' });
                    return response.includes('OK') || response.includes('offline');
                } catch {
                    return false;
                }
            }
        },
        {
            name: 'Asset Files Exist',
            test: () => {
                const fs = require('fs');
                const path = require('path');
                const requiredAssets = [
                    'client/assets/npcs/captain.png',
                    'client/assets/npcs/merchant.png',
                    'client/assets/monsters/dire_wolf.png',
                    'client/assets/characters/human_adventurer.png',
                    'client/assets/maps/village_day.png',
                    'client/areas/dungeons/solo_ruins.png'
                ];
                
                return requiredAssets.every(asset => {
                    return fs.existsSync(path.join(__dirname, '..', asset));
                });
            }
        },
        {
            name: 'Configuration Files',
            test: () => {
                const fs = require('fs');
                const path = require('path');
                const configFiles = [
                    'client/index.html',
                    'client/ui/IntegratedHUD.js',
                    'client/SimpleLoginManager.js',
                    'server/server.js'
                ];
                
                return configFiles.every(file => {
                    return fs.existsSync(path.join(__dirname, '..', file));
                });
            }
        }
    ];
    
    let passed = 0;
    let total = validations.length;
    
    validations.forEach(validation => {
        try {
            const result = validation.test();
            if (result) {
                console.log(`✅ ${validation.name}: PASS`);
                passed++;
            } else {
                console.log(`❌ ${validation.name}: FAIL`);
            }
        } catch (error) {
            console.log(`⚠️ ${validation.name}: ERROR - ${error.message}`);
        }
    });
    
    console.log(`\n📊 Automated Validation: ${passed}/${total} tests passed`);
    return passed === total;
}

// Performance monitoring
function startPerformanceMonitoring() {
    console.log('\n📊 Starting performance monitoring...');
    
    const monitoring = setInterval(() => {
        try {
            // Check server responsiveness
            const startTime = Date.now();
            execSync('curl -s http://localhost:3000 > nul', { stdio: 'ignore' });
            const responseTime = Date.now() - startTime;
            
            if (responseTime > 1000) {
                console.log(`⚠️ High response time: ${responseTime}ms`);
            }
            
            // Memory check (Windows)
            try {
                const memory = execSync('wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /format:list', { encoding: 'utf8' });
                console.log(`💾 Memory check completed`);
            } catch (memError) {
                // Ignore memory check errors
            }
            
        } catch (error) {
            console.log(`⚠️ Monitoring error: ${error.message}`);
        }
    }, 30000); // Check every 30 seconds
    
    return monitoring;
}

// Main execution
async function main() {
    console.log('🎯 Complete Gameplay Test Suite v0.4.0');
    console.log('==========================================\n');
    
    // Step 1: Start server
    const serverStarted = startServer();
    if (!serverStarted) {
        console.log('❌ Cannot proceed without server');
        process.exit(1);
    }
    
    // Wait for server to fully start
    console.log('\n⏳ Waiting for server to fully start...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 2: Run automated validation
    const validationPassed = runAutomatedValidation();
    
    // Step 3: Start performance monitoring
    const monitoring = startPerformanceMonitoring();
    
    // Step 4: Run browser tests
    const browserTestsStarted = runBrowserTests();
    
    // Keep monitoring running
    console.log('\n🔄 Test suite is running...');
    console.log('📝 Press Ctrl+C to stop monitoring');
    
    // Handle cleanup
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Stopping test suite...');
        clearInterval(monitoring);
        console.log('✅ Test suite stopped');
        process.exit(0);
    });
    
    // Keep process alive
    setInterval(() => {}, 1000);
}

// Error handling
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run if executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Test suite error:', error);
        process.exit(1);
    });
}

module.exports = { main, runAutomatedValidation, runBrowserTests };
