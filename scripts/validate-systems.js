// Validate All Integrated Systems
// Comprehensive system validation for Gehlenn MMORPG v0.4.0

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating All Integrated Systems\n');

// System validation categories
const systemValidations = {
    server: {
        name: 'Server Systems',
        files: [
            'server/server.js',
            'server/world/advancedSpawnSystem.js',
            'server/ai/AIMobController.js',
            'server/systems/CombatSystem.js',
            'server/modules/inventory/InventorySystem.js'
        ],
        checks: [
            {
                name: 'Server Configuration',
                validate: () => {
                    const serverPath = path.join(__dirname, '../server/server.js');
                    if (!fs.existsSync(serverPath)) return false;
                    
                    const content = fs.readFileSync(serverPath, 'utf8');
                    return content.includes('app.listen') || content.includes('server.listen');
                }
            },
            {
                name: 'Spawn System',
                validate: () => {
                    const spawnPath = path.join(__dirname, '../server/world/advancedSpawnSystem.js');
                    return fs.existsSync(spawnPath);
                }
            },
            {
                name: 'AI System',
                validate: () => {
                    const aiPath = path.join(__dirname, '../server/ai/AIMobController.js');
                    return fs.existsSync(aiPath);
                }
            }
        ]
    },
    client: {
        name: 'Client Systems',
        files: [
            'client/index.html',
            'client/ui/IntegratedHUD.js',
            'client/SimpleLoginManager.js',
            'client/IntegratedGameplayEngine.js',
            'client/IntegratedAssetManager.js'
        ],
        checks: [
            {
                name: 'HTML Structure',
                validate: () => {
                    const htmlPath = path.join(__dirname, '../client/index.html');
                    const content = fs.readFileSync(htmlPath, 'utf8');
                    return content.includes('<!DOCTYPE html>') && content.includes('</html>');
                }
            },
            {
                name: 'HUD System',
                validate: () => {
                    const hudPath = path.join(__dirname, '../client/ui/IntegratedHUD.js');
                    const content = fs.readFileSync(hudPath, 'utf8');
                    return content.includes('class IntegratedHUD') && content.includes('show()');
                }
            },
            {
                name: 'Login Manager',
                validate: () => {
                    const loginPath = path.join(__dirname, '../client/SimpleLoginManager.js');
                    const content = fs.readFileSync(loginPath, 'utf8');
                    return content.includes('class SimpleLoginManager') && content.includes('handleEnterWorld');
                }
            }
        ]
    },
    assets: {
        name: 'Asset System',
        files: [],
        checks: [
            {
                name: 'NPC Assets',
                validate: () => {
                    const npcDir = path.join(__dirname, '../client/assets/npcs');
                    if (!fs.existsSync(npcDir)) return false;
                    
                    const requiredNPCs = ['captain.png', 'merchant.png', 'innkeeper.png'];
                    const npcs = fs.readdirSync(npcDir);
                    return requiredNPCs.every(npc => npcs.includes(npc));
                }
            },
            {
                name: 'Monster Assets',
                validate: () => {
                    const monsterDir = path.join(__dirname, '../client/assets/monsters');
                    if (!fs.existsSync(monsterDir)) return false;
                    
                    const requiredMonsters = ['dire_wolf.png', 'goblin_raider.png'];
                    const monsters = fs.readdirSync(monsterDir);
                    return requiredMonsters.every(monster => monsters.includes(monster));
                }
            },
            {
                name: 'Character Assets',
                validate: () => {
                    const charDir = path.join(__dirname, '../client/assets/characters');
                    if (!fs.existsSync(charDir)) return false;
                    
                    const requiredChars = ['human_adventurer.png'];
                    const chars = fs.readdirSync(charDir);
                    return requiredChars.every(char => chars.includes(char));
                }
            },
            {
                name: 'Map Assets',
                validate: () => {
                    const mapDir = path.join(__dirname, '../client/assets/maps');
                    if (!fs.existsSync(mapDir)) return false;
                    
                    const requiredMaps = ['village_day.png'];
                    const maps = fs.readdirSync(mapDir);
                    return requiredMaps.every(map => maps.includes(map));
                }
            }
        ]
    },
    integration: {
        name: 'Integration Points',
        files: [],
        checks: [
            {
                name: 'HUD-Login Integration',
                validate: () => {
                    const loginPath = path.join(__dirname, '../client/SimpleLoginManager.js');
                    const content = fs.readFileSync(loginPath, 'utf8');
                    return content.includes('window.hudSystem.show()') && content.includes('window.hudSystem.hide()');
                }
            },
            {
                name: 'Asset Loading Integration',
                validate: () => {
                    const assetPath = path.join(__dirname, '../client/IntegratedAssetManager.js');
                    const content = fs.readFileSync(assetPath, 'utf8');
                    return content.includes('loadAssets') && content.includes('Asset não encontrado');
                }
            },
            {
                name: 'Game Engine Integration',
                validate: () => {
                    const enginePath = path.join(__dirname, '../client/IntegratedGameplayEngine.js');
                    const content = fs.readFileSync(enginePath, 'utf8');
                    return content.includes('initializeGameplay') && content.includes('start()');
                }
            }
        ]
    }
};

// Run validation
function runValidation() {
    let totalChecks = 0;
    let passedChecks = 0;
    let failedChecks = 0;
    
    console.log('🔍 Running System Validation...\n');
    
    Object.entries(systemValidations).forEach(([category, validation]) => {
        console.log(`📂 ${validation.name}:`);
        
        // Check files exist
        validation.files.forEach(file => {
            totalChecks++;
            const filePath = path.join(__dirname, '..', file);
            if (fs.existsSync(filePath)) {
                console.log(`   ✅ ${file}`);
                passedChecks++;
            } else {
                console.log(`   ❌ ${file} - NOT FOUND`);
                failedChecks++;
            }
        });
        
        // Run checks
        validation.checks.forEach(check => {
            totalChecks++;
            try {
                const result = check.validate();
                if (result) {
                    console.log(`   ✅ ${check.name}`);
                    passedChecks++;
                } else {
                    console.log(`   ❌ ${check.name}`);
                    failedChecks++;
                }
            } catch (error) {
                console.log(`   ⚠️ ${check.name} - ERROR: ${error.message}`);
                failedChecks++;
            }
        });
        
        console.log('');
    });
    
    return { total: totalChecks, passed: passedChecks, failed: failedChecks };
}

// Check server connectivity
function checkServerConnectivity() {
    console.log('🌐 Checking Server Connectivity...');
    
    try {
        const http = require('http');
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/',
            method: 'GET',
            timeout: 5000
        };
        
        const req = http.request(options, (res) => {
            console.log(`   ✅ Server responding (Status: ${res.statusCode})`);
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (data.includes('Legacy of Komodo')) {
                    console.log('   ✅ Game page loading correctly');
                } else {
                    console.log('   ⚠️ Game page may have issues');
                }
            });
        });
        
        req.on('error', (err) => {
            console.log(`   ❌ Server connection failed: ${err.message}`);
        });
        
        req.on('timeout', () => {
            console.log('   ❌ Server connection timeout');
            req.destroy();
        });
        
        req.end();
        
    } catch (error) {
        console.log(`   ❌ Connectivity check failed: ${error.message}`);
    }
}

// Generate validation report
function generateReport(results) {
    const report = {
        timestamp: new Date().toISOString(),
        version: '0.4.0',
        results,
        summary: {
            total: results.total,
            passed: results.passed,
            failed: results.failed,
            passRate: Math.round((results.passed / results.total) * 100)
        },
        status: results.failed === 0 ? 'PASS' : 'FAIL'
    };
    
    const reportPath = path.join(__dirname, '../reports/system-validation.json');
    const reportsDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📋 Validation report saved: ${reportPath}`);
    
    return report;
}

// Main execution
function main() {
    console.log('🎯 System Validation Suite v0.4.0');
    console.log('====================================\n');
    
    // Run validation
    const results = runValidation();
    
    // Check server connectivity
    checkServerConnectivity();
    
    // Generate report
    const report = generateReport(results);
    
    // Display summary
    console.log('\n📊 Validation Summary:');
    console.log(`   Total Checks: ${results.total}`);
    console.log(`   Passed: ${results.passed}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Pass Rate: ${Math.round((results.passed / results.total) * 100)}%`);
    console.log(`   Status: ${report.status}`);
    
    if (report.status === 'PASS') {
        console.log('\n🎉 All systems validated successfully!');
        console.log('✅ Ready for comprehensive gameplay testing');
    } else {
        console.log('\n⚠️ Some systems need attention');
        console.log('🔧 Fix failed checks before gameplay testing');
    }
    
    return report.status === 'PASS';
}

// Run if executed directly
if (require.main === module) {
    const success = main();
    process.exit(success ? 0 : 1);
}

module.exports = { main, runValidation, checkServerConnectivity };
