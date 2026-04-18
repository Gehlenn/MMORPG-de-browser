// Mob Spawner System
// Sistema de spawn automático de mobs para combate

class MobSpawner {
    constructor() {
        this.mobs = new Map();
        this.spawnInterval = null;
        this.maxMobs = 15;
        this.spawnRate = 3000; // Spawn every 3 seconds
        this.aggroRange = 150; // Range para mobs atacarem jogadores
    }
    
    start() {
        console.log('👾 Starting Mob Spawner...');
        
        // Spawn initial mobs
        for (let i = 0; i < 5; i++) {
            setTimeout(() => this.spawnRandomMob(), i * 500);
        }
        
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
            { type: 'goblin', health: 50, damage: 10, speed: 2, color: '#228B22', exp: 25 },
            { type: 'wolf', health: 75, damage: 15, speed: 3, color: '#696969', exp: 40 },
            { type: 'orc', health: 100, damage: 20, speed: 1.5, color: '#8B4513', exp: 60 },
            { type: 'slime', health: 30, damage: 5, speed: 1, color: '#90EE90', exp: 15 }
        ];
        
        const randomMob = mobTypes[Math.floor(Math.random() * mobTypes.length)];
        const mobId = `mob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Random spawn position near center
        const spawnX = 300 + Math.random() * 200;
        const spawnY = 200 + Math.random() * 200;
        
        const mob = {
            id: mobId,
            type: randomMob.type,
            name: `${randomMob.type.charAt(0).toUpperCase() + randomMob.type.slice(1)}`,
            x: spawnX,
            y: spawnY,
            stats: {
                health: randomMob.health,
                maxHealth: randomMob.health,
                damage: randomMob.damage,
                defense: Math.floor(randomMob.health / 10),
                speed: randomMob.speed,
                exp: randomMob.exp
            },
            color: randomMob.color,
            velocity: { x: 0, y: 0 },
            target: null,
            lastAttack: 0,
            attackCooldown: 0
        };
        
        this.mobs.set(mobId, mob);
        
        // Emit mob spawn event
        if (global.io && global.io.emit) {
            global.io.emit('mobSpawn', mob);
            console.log(`👾 Spawned ${mob.name} at (${spawnX}, ${spawnY})`);
        }
    }
    
    updateMobAI(mobId, playerPosition) {
        const mob = this.mobs.get(mobId);
        if (!mob || !playerPosition || mob.stats.health <= 0) return;
        
        // Simple AI: move towards player if close enough
        const dx = playerPosition.x - mob.x;
        const dy = playerPosition.y - mob.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.aggroRange) { // Aggro range
            mob.target = playerPosition;
            
            // Move towards player
            if (distance > 30) { // Don't get too close
                const moveX = (dx / distance) * mob.stats.speed;
                const moveY = (dy / distance) * mob.stats.speed;
                
                mob.x += moveX;
                mob.y += moveY;
                mob.velocity = { x: moveX, y: moveY };
                
                // Emit position update
                if (global.io && global.io.emit) {
                    global.io.emit('mobUpdate', { id: mobId, x: mob.x, y: mob.y });
                }
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
            if (global.io && global.io.emit) {
                global.io.emit('mobRemove', { id: mobId });
                console.log(`💀 Removed mob ${mobId}`);
            }
        }
    }
    
    // Combat method
    attackMob(mobId, damage, attackerId) {
        const mob = this.mobs.get(mobId);
        if (!mob || mob.stats.health <= 0) return false;
        
        const now = Date.now();
        if (now - mob.attackCooldown < 1000) return false; // Attack cooldown
        
        mob.stats.health -= damage;
        mob.attackCooldown = now;
        
        if (mob.stats.health <= 0) {
            // Mob defeated
            this.removeMob(mobId);
            
            // Emit defeat event
            if (global.io && global.io.emit) {
                global.io.emit('mobDefeated', { 
                    mobId, 
                    exp: mob.stats.exp,
                    defeatedBy: attackerId 
                });
            }
            
            console.log(`💀 Mob ${mob.name} defeated by ${attackerId}`);
            return true;
        } else {
            // Update mob health
            if (global.io && global.io.emit) {
                global.io.emit('mobUpdate', { 
                    id: mobId, 
                    health: mob.stats.health,
                    maxHealth: mob.stats.maxHealth 
                });
            }
            
            console.log(`⚔️ ${mob.name} took ${damage} damage, HP: ${mob.stats.health}/${mob.stats.maxHealth}`);
            return false;
        }
    }
}

// Initialize and start mob spawner
global.mobSpawner = new MobSpawner();

// Export for use in other modules
if (typeof module !== 'undefined') {
    module.exports = MobSpawner;
}

console.log('👾 Mob Spawner System loaded');
