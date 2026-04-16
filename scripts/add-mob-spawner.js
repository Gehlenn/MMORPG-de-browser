// Add Mob Spawner to Server
// Adiciona sistema de spawn de mobs no servidor

const fs = require('fs');
const path = require('path');

console.log('👾 Adding Mob Spawner to Server\n');

// Mob spawner code to add
const mobSpawnerCode = `
// Mob Spawner System
class MobSpawner {
    constructor() {
        this.mobs = new Map();
        this.spawnInterval = null;
        this.maxMobs = 20;
        this.spawnRate = 5000; // Spawn every 5 seconds
    }
    
    start() {
        console.log('👾 Starting Mob Spawner...');
        
        // Start spawning loop
        this.spawnInterval = setInterval(() => {
            this.spawnRandomMob();
        }, this.spawnRate);
        
        console.log('✅ Mob Spawner started');
    }
    
    stop() {
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
            console.log('🛑 Mob Spawner stopped');
        }
    }
    
    spawnRandomMob() {
        // Don't spawn if too many mobs
        if (this.mobs.size >= this.maxMobs) {
            return;
        }
        
        const mobTypes = [
            { type: 'goblin', health: 50, damage: 10, speed: 2, color: '#228B22' },
            { type: 'wolf', health: 75, damage: 15, speed: 3, color: '#696969' },
            { type: 'orc', health: 100, damage: 20, speed: 1.5, color: '#8B4513' },
            { type: 'slime', health: 30, damage: 5, speed: 1, color: '#90EE90' }
        ];
        
        const randomMob = mobTypes[Math.floor(Math.random() * mobTypes.length)];
        const mobId = \`mob_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
        
        // Random spawn position near center
        const spawnX = 300 + Math.random() * 200;
        const spawnY = 200 + Math.random() * 200;
        
        const mob = {
            id: mobId,
            type: randomMob.type,
            name: \`\${randomMob.type.charAt(0).toUpperCase() + randomMob.type.slice(1)}\`,
            x: spawnX,
            y: spawnY,
            stats: {
                health: randomMob.health,
                maxHealth: randomMob.health,
                damage: randomMob.damage,
                defense: Math.floor(randomMob.health / 10),
                speed: randomMob.speed,
                exp: Math.floor(randomMob.health * 1.5)
            },
            color: randomMob.color,
            velocity: { x: 0, y: 0 },
            target: null,
            lastAttack: 0
        };
        
        this.mobs.set(mobId, mob);
        
        // Emit mob spawn event
        if (global.io) {
            global.io.emit('mobSpawn', mob);
            console.log(\`👾 Spawned \${mob.name} at (\${spawnX}, \${spawnY})\`);
        }
    }
    
    updateMobAI(mobId, playerPosition) {
        const mob = this.mobs.get(mobId);
        if (!mob || !playerPosition) return;
        
        // Simple AI: move towards player if close enough
        const dx = playerPosition.x - mob.x;
        const dy = playerPosition.y - mob.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 200) { // Aggro range
            mob.target = playerPosition;
            
            // Move towards player
            const moveX = (dx / distance) * mob.stats.speed;
            const moveY = (dy / distance) * mob.stats.speed;
            
            mob.x += moveX;
            mob.y += moveY;
            mob.velocity = { x: moveX, y: moveY };
            
            // Emit position update
            if (global.io) {
                global.io.emit('mobUpdate', { id: mobId, x: mob.x, y: mob.y });
            }
        }
    }
    
    getMob(mobId) {
        return this.mobs.get(mobId);
    }
    
    getAllMobs() {
        return Array.from(this.mobs.values());
    }
    
    removeMob(mobId) {
        if (this.mobs.has(mobId)) {
            this.mobs.delete(mobId);
            
            // Emit mob removal
            if (global.io) {
                global.io.emit('mobRemove', { id: mobId });
                console.log(\`💀 Removed mob \${mobId}\`);
            }
        }
    }
}

// Initialize and start mob spawner
global.mobSpawner = new MobSpawner();
global.mobSpawner.start();

// Export for use in other modules
if (typeof module !== 'undefined') {
    module.exports = MobSpawner;
}
`;

// Add mob spawner to server.js
function addMobSpawnerToServer() {
    const serverPath = path.join(__dirname, '../server/server.js');
    
    if (!fs.existsSync(serverPath)) {
        console.error('❌ server.js not found');
        return false;
    }
    
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Find where to insert the mob spawner (after server setup)
    const insertPoint = serverContent.indexOf('// Start the server');
    
    if (insertPoint === -1) {
        console.error('❌ Could not find insertion point in server.js');
        return false;
    }
    
    // Insert mob spawner code
    const beforeInsert = serverContent.substring(0, insertPoint);
    const afterInsert = serverContent.substring(insertPoint);
    
    const newServerContent = beforeInsert + mobSpawnerCode + '\n\n' + afterInsert;
    
    // Write updated server.js
    fs.writeFileSync(serverPath, newServerContent);
    
    console.log('✅ Mob spawner added to server.js');
    return true;
}

// Add mob spawner event handlers
function addMobSpawnerEvents() {
    const serverPath = path.join(__dirname, '../server/server.js');
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Add socket handlers for mob events
    const eventHandlers = `
// Handle mob connections
io.on('connection', (socket) => {
    console.log('🔌 Player connected:', socket.id);
    
    // Send current mobs to new player
    if (global.mobSpawner) {
        const mobs = global.mobSpawner.getAllMobs();
        socket.emit('currentMobs', mobs);
    }
    
    socket.on('playerMove', (data) => {
        // Update all mobs AI when player moves
        if (global.mobSpawner) {
            global.mobSpawner.getAllMobs().forEach(mob => {
                global.mobSpawner.updateMobAI(mob.id, data.position);
            });
        }
    });
    
    socket.on('attackMob', (data) => {
        // Handle mob combat
        const { mobId, damage } = data;
        const mob = global.mobSpawner.getMob(mobId);
        
        if (mob) {
            mob.stats.health -= damage;
            
            if (mob.stats.health <= 0) {
                // Mob defeated
                global.mobSpawner.removeMob(mobId);
                socket.emit('mobDefeated', { mobId, exp: mob.stats.exp });
            } else {
                // Update mob health
                socket.emit('mobUpdate', { id: mobId, health: mob.stats.health });
            }
        }
    });
    
    socket.on('disconnect', () => {
        console.log('🔌 Player disconnected:', socket.id);
    });
});
`;
    
    // Insert event handlers before server start
    const serverStartPoint = serverContent.indexOf('app.listen(');
    
    if (serverStartPoint === -1) {
        console.error('❌ Could not find server start point');
        return false;
    }
    
    const beforeServerStart = serverContent.substring(0, serverStartPoint);
    const afterServerStart = serverContent.substring(serverStartPoint);
    
    const newServerContent = beforeServerStart + eventHandlers + '\n\n' + afterServerStart;
    
    fs.writeFileSync(serverPath, newServerContent);
    console.log('✅ Mob spawner event handlers added to server.js');
    return true;
}

// Main execution
function main() {
    console.log('🎯 Mob Spawner Integration v0.4.0');
    console.log('=================================\n');
    
    // Add mob spawner code
    const spawnerAdded = addMobSpawnerToServer();
    
    if (!spawnerAdded) {
        console.error('❌ Failed to add mob spawner');
        process.exit(1);
    }
    
    // Add event handlers
    const eventsAdded = addMobSpawnerEvents();
    
    if (!eventsAdded) {
        console.error('❌ Failed to add event handlers');
        process.exit(1);
    }
    
    console.log('\n🎉 Mob spawner successfully integrated!');
    console.log('📋 Features added:');
    console.log('   - Automatic mob spawning');
    console.log('   - Mob AI movement');
    console.log('   - Combat system');
    console.log('   - Player tracking');
    console.log('   - Socket.io events');
    
    console.log('\n🔄 Restart server to apply changes:');
    console.log('   npm start');
    
    console.log('\n🎮 After restart:');
    console.log('   1. Mobs will spawn automatically');
    console.log('   2. Mobs will follow players');
    console.log('   3. Combat will be functional');
    console.log('   4. HP bars and combat feedback');
}

// Run if executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Integration error:', error);
        process.exit(1);
    });
}

module.exports = { main, addMobSpawnerToServer, addMobSpawnerEvents };
