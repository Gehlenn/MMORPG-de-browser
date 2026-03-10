/**
 * Simple Combat System
 * Handles basic combat between players and mobs
 */

class SimpleCombat {
    constructor() {
        this.attackRange = 50; // 50 pixels attack range
        this.attackCooldown = 500; // 500ms between attacks
        this.lastAttackTimes = new Map(); // player -> last attack time
        
        console.log('⚔️ Simple Combat System initialized');
    }
    
    /**
     * Handle player attack
     */
    handlePlayerAttack(socket, attackData) {
        const now = Date.now();
        const playerId = socket.id;
        
        // Check attack cooldown
        const lastAttackTime = this.lastAttackTimes.get(playerId) || 0;
        if (now - lastAttackTime < this.attackCooldown) {
            console.log('⏱️ Attack on cooldown');
            return;
        }
        
        // Update last attack time
        this.lastAttackTimes.set(playerId, now);
        
        // Get player and attack position
        const player = this.server.players.get(playerId);
        if (!player) return;
        
        const attackX = attackData.x || player.x;
        const attackY = attackData.y || player.y;
        
        console.log(`⚔️ Player ${player.username} attacking at (${attackX}, ${attackY})`);
        
        // Find mobs in range
        const mobsInWorld = this.server.mobSpawner.getAllMobs();
        const hitMobs = [];
        
        for (const mob of mobsInWorld) {
            if (mob.isDead) continue;
            
            const distance = Math.sqrt(Math.pow(mob.x - attackX, 2) + Math.pow(mob.y - attackY, 2));
            if (distance <= this.attackRange) {
                hitMobs.push(mob);
            }
        }
        
        // Apply damage to hit mobs
        for (const mob of hitMobs) {
            const damage = this.calculateDamage(player, mob);
            const mobDied = this.server.mobSpawner.damageMob(mob.id, damage);
            
            if (mobDied) {
                // Give XP to player
                this.giveXPToPlayer(player, mob.xpValue);
                
                // Remove mob from world
                this.server.mobSpawner.removeMob(mob.id);
                
                // Notify all players
                this.server.io.emit('mob_death', {
                    mobId: mob.id,
                    playerId: playerId,
                    xpGained: mob.xpValue
                });
                
                // Update world state for all players
                this.updateWorldState();
            } else {
                // Notify mob damage
                this.server.io.emit('mob_damage', {
                    mobId: mob.id,
                    damage: damage,
                    currentHealth: mob.health
                });
            }
        }
        
        // Send attack result to player
        socket.emit('attack_result', {
            hitCount: hitMobs.length,
            mobsHit: hitMobs.map(mob => ({
                id: mob.id,
                name: mob.name,
                damage: damage,
                currentHealth: mob.health
            }))
        });
    }
    
    /**
     * Calculate damage based on player and mob
     */
    calculateDamage(player, mob) {
        // Base damage with some randomness
        const baseDamage = 15 + Math.random() * 10; // 15-25 damage
        
        // Player level bonus
        const levelBonus = player.level * 2;
        
        // Random factor for combat variation
        const randomFactor = 0.8 + Math.random() * 0.4; // 0.8-1.2
        
        const totalDamage = Math.round((baseDamage + levelBonus) * randomFactor);
        
        console.log(`🗡️ Damage calculation: base=${baseDamage}, levelBonus=${levelBonus}, random=${randomFactor}, total=${totalDamage}`);
        
        return totalDamage;
    }
    
    /**
     * Give XP to player
     */
    giveXPToPlayer(player, xpAmount) {
        player.xp = (player.xp || 0) + xpAmount;
        
        console.log(`⭐ Player ${player.username} gained ${xpAmount} XP! Total: ${player.xp}`);
        
        // Check for level up
        while (player.xp >= player.xpToNext) {
            this.levelUpPlayer(player);
        }
        
        // Notify player
        const playerSocket = this.getSocketByPlayerId(player.id);
        if (playerSocket) {
            playerSocket.emit('xp_gained', {
                amount: xpAmount,
                totalXP: player.xp,
                level: player.level,
                xpToNext: player.xpToNext
            });
        }
    }
    
    /**
     * Level up player
     */
    levelUpPlayer(player) {
        player.level = (player.level || 1) + 1;
        player.xp = player.xp - player.xpToNext;
        player.xpToNext = player.level * 100; // 100 XP per level
        
        // Increase player stats
        player.maxHp = (player.maxHp || 100) + 10;
        player.hp = player.maxHp; // Full heal on level up
        
        console.log(`🎉 Player ${player.username} leveled up to ${player.level}!`);
        
        // Notify player
        const playerSocket = this.getSocketByPlayerId(player.id);
        if (playerSocket) {
            playerSocket.emit('level_up', {
                newLevel: player.level,
                newMaxHP: player.maxHp,
                newHP: player.hp,
                xpToNext: player.xpToNext
            });
        }
    }
    
    /**
     * Get socket by player ID
     */
    getSocketByPlayerId(playerId) {
        for (const [socketId, socket] of this.server.io.sockets.sockets) {
            const player = this.server.players.get(socketId);
            if (player && player.id === playerId) {
                return socket;
            }
        }
        return null;
    }
    
    /**
     * Update world state for all players
     */
    updateWorldState() {
        const worldData = {
            entities: this.server.mobSpawner.getAllMobs(),
            timestamp: Date.now()
        };
        
        // Send to all players
        this.server.io.emit('world_update', worldData);
    }
    
    /**
     * Set server reference
     */
    setServer(server) {
        this.server = server;
    }
}

module.exports = SimpleCombat;
