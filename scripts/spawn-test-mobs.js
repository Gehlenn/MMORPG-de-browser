// Spawn Test Mobs Script
// Cria mobs para teste de combate

const { execSync } = require('child_process');

console.log('👾 Spawning Test Mobs for Combat Testing\n');

// Mob configurations for testing
const testMobs = [
    {
        id: 'test_goblin_1',
        type: 'goblin',
        name: 'Goblin Teste',
        x: 400,
        y: 300,
        stats: {
            health: 50,
            maxHealth: 50,
            damage: 10,
            defense: 5,
            speed: 2,
            exp: 25
        }
    },
    {
        id: 'test_wolf_1',
        type: 'wolf',
        name: 'Lobo Teste',
        x: 450,
        y: 350,
        stats: {
            health: 75,
            maxHealth: 75,
            damage: 15,
            defense: 8,
            speed: 3,
            exp: 40
        }
    },
    {
        id: 'test_orc_1',
        type: 'orc',
        name: 'Orc Teste',
        x: 350,
        y: 250,
        stats: {
            health: 100,
            maxHealth: 100,
            damage: 20,
            defense: 12,
            speed: 1.5,
            exp: 60
        }
    },
    {
        id: 'test_slime_1',
        type: 'slime',
        name: 'Slime Teste',
        x: 500,
        y: 400,
        stats: {
            health: 30,
            maxHealth: 30,
            damage: 5,
            defense: 2,
            speed: 1,
            exp: 15
        }
    }
];

// Create WebSocket connection to spawn mobs
function spawnMobs() {
    console.log('🔌 Connecting to server to spawn test mobs...');
    
    try {
        const WebSocket = require('ws');
        const ws = new WebSocket('ws://localhost:3000');
        
        ws.on('open', () => {
            console.log('✅ Connected to server');
            
            // Spawn each test mob
            testMobs.forEach((mob, index) => {
                setTimeout(() => {
                    const spawnData = {
                        type: 'spawnMob',
                        data: mob
                    };
                    
                    ws.send(JSON.stringify(spawnData));
                    console.log(`👾 Spawned: ${mob.name} at (${mob.x}, ${mob.y})`);
                }, index * 1000); // Spawn each mob with 1 second delay
            });
            
            // Close connection after spawning all mobs
            setTimeout(() => {
                ws.close();
                console.log('🔌 Disconnected from server');
            }, testMobs.length * 1000 + 2000);
        });
        
        ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error.message);
        });
        
        ws.on('close', () => {
            console.log('🔌 Connection closed');
        });
        
    } catch (error) {
        console.error('❌ Failed to create WebSocket connection:', error.message);
        console.log('⚠️ Make sure server is running and supports WebSocket');
    }
}

// Alternative: Use HTTP request if WebSocket fails
function spawnMobsHTTP() {
    console.log('🌐 Using HTTP to spawn test mobs...');
    
    testMobs.forEach((mob, index) => {
        setTimeout(() => {
            try {
                const http = require('http');
                const data = JSON.stringify(mob);
                
                const options = {
                    hostname: 'localhost',
                    port: 3000,
                    path: '/spawn-mob',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(data)
                    }
                };
                
                const req = http.request(options, (res) => {
                    console.log(`✅ Spawned: ${mob.name} - Status: ${res.statusCode}`);
                });
                
                req.on('error', (error) => {
                    console.log(`⚠️ Failed to spawn ${mob.name}: ${error.message}`);
                });
                
                req.write(data);
                req.end();
                
            } catch (error) {
                console.error(`❌ Error spawning ${mob.name}:`, error.message);
            }
        }, index * 1000);
    });
}

// Check server status
function checkServerStatus() {
    try {
        const response = execSync('curl -s http://localhost:3000/health || echo "offline"', { encoding: 'utf8' });
        
        if (response.includes('OK') || response.includes('online')) {
            console.log('✅ Server is online');
            return true;
        } else {
            console.log('⚠️ Server may be offline');
            return false;
        }
    } catch (error) {
        console.log('❌ Cannot check server status:', error.message);
        return false;
    }
}

// Main execution
function main() {
    console.log('🎯 Test Mob Spawner v0.4.0');
    console.log('==============================\n');
    
    // Check if server is running
    const serverOnline = checkServerStatus();
    
    if (!serverOnline) {
        console.log('❌ Server is not running. Please start the server first.');
        console.log('💡 Run: npm start');
        process.exit(1);
    }
    
    console.log('📋 Spawning test mobs:');
    testMobs.forEach((mob, index) => {
        console.log(`   ${index + 1}. ${mob.name} (${mob.type}) - HP: ${mob.stats.health}, DMG: ${mob.stats.damage}`);
    });
    
    console.log('\n🚀 Spawning mobs...');
    
    // Try WebSocket first, fallback to HTTP
    try {
        spawnMobs();
    } catch (error) {
        console.log('⚠️ WebSocket failed, trying HTTP...');
        spawnMobsHTTP();
    }
    
    console.log('\n📝 Instructions:');
    console.log('1. Mobs will spawn near your character');
    console.log('2. Use WASD to move and approach mobs');
    console.log('3. Click on mobs to initiate combat');
    console.log('4. Test combat mechanics and damage');
    console.log('5. Check HP bar and combat feedback');
    
    console.log('\n🎮 Test mobs will be ready in 5 seconds!');
}

// Run if executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Mob spawner error:', error);
        process.exit(1);
    });
}

module.exports = { main, spawnMobs, testMobs };
