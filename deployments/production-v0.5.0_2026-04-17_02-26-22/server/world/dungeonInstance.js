/**
 * Dungeon Instance System - Instanced Dungeon Management
 * Handles dungeon creation, mob spawning, boss management, and party instances
 * Version 0.3.3 - Cooperative Multiplayer Gameplay
 */

class DungeonInstance {
    constructor(server) {
        this.server = server;
        
        // Instance storage
        this.instances = new Map(); // instanceId -> instance data
        this.playerInstances = new Map(); // playerId -> instanceId
        
        // Configuration
        this.config = {
            maxInstances: 100,
            instanceTimeout: 3600000, // 1 hour
            cleanupInterval: 300000, // 5 minutes
            mobRespawnTime: 30000, // 30 seconds
            bossRespawnTime: 300000, // 5 minutes
            maxMobsPerRoom: 10
        };
        
        // Dungeon types
        this.dungeonTypes = {
            solo: {
                name: 'Solo Dungeon',
                maxPlayers: 1,
                difficulty: 1.0,
                mobLevelMultiplier: 1.0,
                bossLevelMultiplier: 1.2,
                lootMultiplier: 1.0
            },
            group: {
                name: 'Group Dungeon',
                maxPlayers: 5,
                difficulty: 1.5,
                mobLevelMultiplier: 1.2,
                bossLevelMultiplier: 1.5,
                lootMultiplier: 1.5
            },
            raid: {
                name: 'Raid Dungeon',
                maxPlayers: 10,
                difficulty: 2.0,
                mobLevelMultiplier: 1.5,
                bossLevelMultiplier: 2.0,
                lootMultiplier: 2.0
            }
        };
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        this.setupEventHandlers();
        this.startCleanupTimer();
        console.log('Dungeon Instance System initialized');
    }
    
    setupEventHandlers() {
        this.server.on('enterDungeon', (socket, data) => {
            this.handleEnterDungeon(socket, data);
        });
        
        this.server.on('leaveDungeon', (socket) => {
            this.handleLeaveDungeon(socket);
        });
        
        this.server.on('requestDungeonInfo', (socket) => {
            this.handleRequestDungeonInfo(socket);
        });
        
        this.server.on('playerDisconnected', (playerId) => {
            this.handlePlayerDisconnected(playerId);
        });
        
        this.server.on('mobDeath', (mobId, source) => {
            this.handleMobDeath(mobId, source);
        });
    }
    
    handleEnterDungeon(socket, data) {
        const { dungeonType, dungeonId } = data;
        const player = this.server.players.get(socket.playerId);
        
        if (!player) return;
        
        // Check if player is already in a dungeon
        if (this.playerInstances.has(socket.playerId)) {
            socket.emit('dungeonError', { message: 'Você já está em uma dungeon!' });
            return;
        }
        
        // Get party if exists
        const party = this.server.systems.partySystem?.getParty(socket.playerId);
        
        // Validate dungeon type
        const dungeonConfig = this.dungeonTypes[dungeonType];
        if (!dungeonConfig) {
            socket.emit('dungeonError', { message: 'Tipo de dungeon inválido!' });
            return;
        }
        
        // Check party requirements for group/raid dungeons
        if (dungeonType === 'group' || dungeonType === 'raid') {
            if (!party) {
                socket.emit('dungeonError', { message: 'Você precisa estar em um grupo para esta dungeon!' });
                return;
            }
            
            const partySize = this.server.systems.partySystem.getPartySize(socket.playerId);
            if (partySize < 2) {
                socket.emit('dungeonError', { message: 'Grupo precisa ter pelo menos 2 membros!' });
                return;
            }
            
            if (partySize > dungeonConfig.maxPlayers) {
                socket.emit('dungeonError', { message: `Grupo muito grande para esta dungeon (máx: ${dungeonConfig.maxPlayers})!` });
                return;
            }
            
            // Check if party leader is entering
            if (!this.server.systems.partySystem.isPartyLeader(socket.playerId)) {
                socket.emit('dungeonError', { message: 'Apenas o líder do grupo pode entrar na dungeon!' });
                return;
            }
        }
        
        // Create or get instance
        let instance;
        if (dungeonType === 'solo') {
            // Create solo instance
            instance = this.createInstance(dungeonType, socket.playerId, null);
        } else {
            // Create party instance
            instance = this.createInstance(dungeonType, party.id, party);
        }
        
        if (!instance) {
            socket.emit('dungeonError', { message: 'Não foi possível criar a instância!' });
            return;
        }
        
        // Add player to instance
        this.addPlayerToInstance(socket.playerId, instance.id);
        
        // Send dungeon info to player
        socket.emit('dungeonEntered', {
            instanceId: instance.id,
            dungeonType: dungeonType,
            dungeonName: dungeonConfig.name,
            players: instance.players.size,
            maxPlayers: dungeonConfig.maxPlayers
        });
        
        // Notify other players in instance
        this.broadcastToInstance(instance.id, 'playerEnteredDungeon', {
            playerId: socket.playerId,
            playerName: player.name
        }, socket.playerId);
        
        console.log(`Player ${player.name} entered ${dungeonType} dungeon ${instance.id}`);
    }
    
    handleLeaveDungeon(socket) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const instanceId = this.playerInstances.get(socket.playerId);
        if (!instanceId) {
            socket.emit('dungeonError', { message: 'Você não está em uma dungeon!' });
            return;
        }
        
        const instance = this.instances.get(instanceId);
        if (!instance) return;
        
        // Remove player from instance
        this.removePlayerFromInstance(socket.playerId);
        
        // Send confirmation
        socket.emit('dungeonLeft', {});
        
        // Notify other players
        this.broadcastToInstance(instanceId, 'playerLeftDungeon', {
            playerId: socket.playerId,
            playerName: player.name
        });
        
        // Check if instance should be closed
        if (instance.players.size === 0) {
            this.closeInstance(instanceId);
        }
        
        console.log(`Player ${player.name} left dungeon ${instanceId}`);
    }
    
    handleRequestDungeonInfo(socket) {
        const instanceId = this.playerInstances.get(socket.playerId);
        if (!instanceId) {
            socket.emit('dungeonError', { message: 'Você não está em uma dungeon!' });
            return;
        }
        
        const instance = this.instances.get(instanceId);
        if (!instance) return;
        
        const dungeonConfig = this.dungeonTypes[instance.type];
        
        socket.emit('dungeonInfo', {
            instanceId: instance.id,
            dungeonType: instance.type,
            dungeonName: dungeonConfig.name,
            players: Array.from(instance.players.values()),
            maxPlayers: dungeonConfig.maxPlayers,
            mobsRemaining: instance.mobs.size,
            bossAlive: !!instance.boss,
            timeRemaining: Math.max(0, instance.expiresAt - Date.now())
        });
    }
    
    handlePlayerDisconnected(playerId) {
        const instanceId = this.playerInstances.get(playerId);
        if (!instanceId) return;
        
        const instance = this.instances.get(instanceId);
        if (!instance) return;
        
        // Remove player from instance
        this.removePlayerFromInstance(playerId);
        
        // Notify other players
        this.broadcastToInstance(instanceId, 'playerDisconnectedDungeon', {
            playerId: playerId
        });
        
        // Check if instance should be closed
        if (instance.players.size === 0) {
            this.closeInstance(instanceId);
        }
    }
    
    handleMobDeath(mobId, source) {
        // Find which instance the mob belongs to
        for (const [instanceId, instance] of this.instances) {
            if (instance.mobs.has(mobId)) {
                this.handleInstanceMobDeath(instanceId, mobId, source);
                break;
            }
            
            if (instance.boss && instance.boss.id === mobId) {
                this.handleInstanceBossDeath(instanceId, source);
                break;
            }
        }
    }
    
    handleInstanceMobDeath(instanceId, mobId, source) {
        const instance = this.instances.get(instanceId);
        if (!instance) return;
        
        const mob = instance.mobs.get(mobId);
        if (!mob) return;
        
        // Remove mob
        instance.mobs.delete(mobId);
        instance.mobsKilled++;
        
        // Distribute XP to players in instance
        this.distributeInstanceXP(instance, mob, source);
        
        // Generate loot
        const loot = this.generateInstanceLoot(instance, mob);
        if (loot && loot.length > 0) {
            this.distributeInstanceLoot(instance, loot);
        }
        
        // Notify players
        this.broadcastToInstance(instanceId, 'mobKilled', {
            mobId: mobId,
            mobType: mob.type,
            killerId: source,
            mobsRemaining: instance.mobs.size
        });
        
        // Schedule respawn
        this.scheduleMobRespawn(instanceId, mob);
        
        // Check if all mobs are cleared (for boss spawn)
        if (instance.mobs.size === 0 && !instance.boss && !instance.bossSpawned) {
            this.spawnBoss(instanceId);
        }
    }
    
    handleInstanceBossDeath(instanceId, source) {
        const instance = this.instances.get(instanceId);
        if (!instance) return;
        
        const boss = instance.boss;
        if (!boss) return;
        
        // Remove boss
        instance.boss = null;
        instance.completed = true;
        instance.completedAt = Date.now();
        
        // Distribute boss XP and loot
        this.distributeInstanceXP(instance, boss, source);
        const bossLoot = this.generateBossLoot(instance, boss);
        if (bossLoot && bossLoot.length > 0) {
            this.distributeInstanceLoot(instance, bossLoot, true);
        }
        
        // Notify players
        this.broadcastToInstance(instanceId, 'bossKilled', {
            bossId: boss.id,
            bossType: boss.type,
            killerId: source,
            loot: bossLoot
        });
        
        // Schedule instance closure
        setTimeout(() => {
            this.closeInstance(instanceId);
        }, 60000); // Close after 1 minute
        
        console.log(`Boss killed in dungeon ${instanceId}`);
    }
    
    createInstance(dungeonType, ownerId, party) {
        // Check instance limit
        if (this.instances.size >= this.config.maxInstances) {
            return null;
        }
        
        const instanceId = this.generateInstanceId();
        const dungeonConfig = this.dungeonTypes[dungeonType];
        
        const instance = {
            id: instanceId,
            type: dungeonType,
            ownerId: ownerId,
            party: party,
            players: new Map(),
            mobs: new Map(),
            boss: null,
            bossSpawned: false,
            mobsKilled: 0,
            completed: false,
            createdAt: Date.now(),
            expiresAt: Date.now() + this.config.instanceTimeout,
            lastActivity: Date.now(),
            currentRoom: 0,
            totalRooms: this.generateRoomCount(dungeonType)
        };
        
        this.instances.set(instanceId, instance);
        
        // Initialize dungeon
        this.initializeDungeon(instance);
        
        return instance;
    }
    
    initializeDungeon(instance) {
        const dungeonConfig = this.dungeonTypes[instance.type];
        
        // Spawn initial mobs
        this.spawnMobs(instance);
        
        console.log(`Dungeon instance ${instance.id} initialized (${instance.type})`);
    }
    
    spawnMobs(instance) {
        const dungeonConfig = this.dungeonTypes[instance.type];
        const mobCount = this.calculateMobCount(instance);
        
        for (let i = 0; i < mobCount; i++) {
            const mob = this.createInstanceMob(instance);
            if (mob) {
                instance.mobs.set(mob.id, mob);
            }
        }
        
        // Register mobs with spawn system
        for (const mob of instance.mobs.values()) {
            this.server.systems.spawnSystem?.addMob(mob);
        }
    }
    
    createInstanceMob(instance) {
        const dungeonConfig = this.dungeonTypes[instance.type];
        
        // Get average player level
        const avgLevel = this.getAveragePlayerLevel(instance);
        const mobLevel = Math.floor(avgLevel * dungeonConfig.mobLevelMultiplier);
        
        // Generate random position in instance
        const position = this.generateRandomPosition(instance);
        
        const mob = {
            id: this.generateMobId(),
            type: this.getRandomMobType(),
            level: mobLevel,
            x: position.x,
            y: position.y,
            health: this.calculateMobHealth(mobLevel),
            maxHealth: this.calculateMobHealth(mobLevel),
            attack: this.calculateMobAttack(mobLevel),
            defense: this.calculateMobDefense(mobLevel),
            instanceId: instance.id,
            respawnTime: this.config.mobRespawnTime,
            value: Math.floor(mobLevel * 10),
            xp: Math.floor(mobLevel * 15)
        };
        
        return mob;
    }
    
    spawnBoss(instanceId) {
        const instance = this.instances.get(instanceId);
        if (!instance || instance.boss || instance.bossSpawned) return;
        
        const dungeonConfig = this.dungeonTypes[instance.type];
        const avgLevel = this.getAveragePlayerLevel(instance);
        const bossLevel = Math.floor(avgLevel * dungeonConfig.bossLevelMultiplier);
        
        // Generate boss position
        const position = this.generateBossPosition(instance);
        
        const boss = {
            id: this.generateMobId(),
            type: this.getRandomBossType(),
            level: bossLevel,
            x: position.x,
            y: position.y,
            health: this.calculateBossHealth(bossLevel),
            maxHealth: this.calculateBossHealth(bossLevel),
            attack: this.calculateBossAttack(bossLevel),
            defense: this.calculateBossDefense(bossLevel),
            instanceId: instance.id,
            isBoss: true,
            respawnTime: this.config.bossRespawnTime,
            value: Math.floor(bossLevel * 50),
            xp: Math.floor(bossLevel * 100)
        };
        
        instance.boss = boss;
        instance.bossSpawned = true;
        
        // Register boss with spawn system
        this.server.systems.spawnSystem?.addMob(boss);
        
        // Notify players
        this.broadcastToInstance(instanceId, 'bossSpawned', {
            bossId: boss.id,
            bossType: boss.type,
            level: boss.level,
            x: boss.x,
            y: boss.y
        });
        
        console.log(`Boss spawned in dungeon ${instanceId}`);
    }
    
    addPlayerToInstance(playerId, instanceId) {
        const instance = this.instances.get(instanceId);
        if (!instance) return;
        
        const player = this.server.players.get(playerId);
        if (!player) return;
        
        // Add player to instance
        instance.players.set(playerId, {
            id: playerId,
            name: player.name,
            level: player.level,
            class: player.class,
            joinedAt: Date.now()
        });
        
        this.playerInstances.set(playerId, instanceId);
        instance.lastActivity = Date.now();
        
        // Store original position for return
        player.originalPosition = {
            x: player.x,
            y: player.y,
            map: player.currentMap || 'world'
        };
        
        // Move player to dungeon entrance
        const entrance = this.getDungeonEntrance(instance);
        player.x = entrance.x;
        player.y = entrance.y;
        player.currentMap = `dungeon_${instanceId}`;
    }
    
    removePlayerFromInstance(playerId) {
        const instanceId = this.playerInstances.get(playerId);
        if (!instanceId) return;
        
        const instance = this.instances.get(instanceId);
        if (!instance) return;
        
        const player = this.server.players.get(playerId);
        
        // Remove player from instance
        instance.players.delete(playerId);
        this.playerInstances.delete(playerId);
        instance.lastActivity = Date.now();
        
        // Return player to original position
        if (player && player.originalPosition) {
            player.x = player.originalPosition.x;
            player.y = player.originalPosition.y;
            player.currentMap = player.originalPosition.map;
            delete player.originalPosition;
        }
    }
    
    distributeInstanceXP(instance, mob, source) {
        const players = Array.from(instance.players.values());
        if (players.length === 0) return;
        
        // Calculate party bonus
        let xpBonus = 1.0;
        if (players.length > 1) {
            xpBonus += 0.1; // 10% party bonus
        }
        
        // Calculate XP per player
        const baseXP = mob.xp || this.calculateMobXP(mob);
        const totalXP = Math.floor(baseXP * xpBonus);
        const xpPerPlayer = Math.floor(totalXP / players.length);
        
        // Distribute XP
        for (const playerData of players) {
            const player = this.server.players.get(playerData.id);
            if (player) {
                this.giveXPToPlayer(player, xpPerPlayer);
                
                // Notify player
                const socket = this.server.getPlayerSocket(playerData.id);
                if (socket) {
                    socket.emit('xpGained', {
                        amount: xpPerPlayer,
                        source: 'dungeon',
                        bonus: xpBonus - 1.0
                    });
                }
            }
        }
    }
    
    distributeInstanceLoot(instance, loot, isBoss = false) {
        const players = Array.from(instance.players.values());
        if (players.length === 0) return;
        
        // Apply loot bonus
        let lootBonus = 1.0;
        if (players.length > 1) {
            lootBonus += 0.1; // 10% party bonus
        }
        
        // Distribute loot randomly
        for (const item of loot) {
            const luckyPlayer = players[Math.floor(Math.random() * players.length)];
            const player = this.server.players.get(luckyPlayer.id);
            
            if (player) {
                // Apply bonus to item quantity/value
                const bonusItem = { ...item };
                if (bonusItem.quantity) {
                    bonusItem.quantity = Math.floor(bonusItem.quantity * lootBonus);
                }
                if (bonusItem.value) {
                    bonusItem.value = Math.floor(bonusItem.value * lootBonus);
                }
                
                // Give item to player
                this.server.systems.itemSystem?.giveItemToPlayer(luckyPlayer.id, bonusItem.id, bonusItem.quantity || 1);
                
                // Notify players
                this.broadcastToInstance(instance.id, 'dungeonLoot', {
                    playerId: luckyPlayer.id,
                    playerName: luckyPlayer.name,
                    item: bonusItem,
                    isBoss: isBoss
                });
            }
        }
    }
    
    scheduleMobRespawn(instanceId, mob) {
        setTimeout(() => {
            const instance = this.instances.get(instanceId);
            if (!instance || instance.completed) return;
            
            // Respawn mob
            const newMob = this.createInstanceMob(instance);
            if (newMob) {
                newMob.id = mob.id; // Keep same ID
                newMob.x = mob.x;
                newMob.y = mob.y;
                instance.mobs.set(mob.id, newMob);
                
                // Register with spawn system
                this.server.systems.spawnSystem?.addMob(newMob);
                
                // Notify players
                this.broadcastToInstance(instanceId, 'mobRespawned', {
                    mobId: mob.id,
                    mobType: newMob.type,
                    x: newMob.x,
                    y: newMob.y
                });
            }
        }, mob.respawnTime);
    }
    
    closeInstance(instanceId) {
        const instance = this.instances.get(instanceId);
        if (!instance) return;
        
        // Remove all players
        for (const [playerId] of instance.players) {
            this.removePlayerFromInstance(playerId);
            
            // Notify player
            const socket = this.server.getPlayerSocket(playerId);
            if (socket) {
                socket.emit('dungeonClosed', {
                    reason: instance.completed ? 'completed' : 'expired'
                });
            }
        }
        
        // Clean up mobs
        for (const mob of instance.mobs.values()) {
            this.server.systems.spawnSystem?.removeMob(mob.id);
        }
        
        if (instance.boss) {
            this.server.systems.spawnSystem?.removeMob(instance.boss.id);
        }
        
        // Remove instance
        this.instances.delete(instanceId);
        
        console.log(`Dungeon instance ${instanceId} closed`);
    }
    
    // Utility Methods
    generateInstanceId() {
        return 'dungeon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateMobId() {
        return 'mob_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }
    
    generateRoomCount(dungeonType) {
        const counts = {
            solo: 3,
            group: 5,
            raid: 8
        };
        return counts[dungeonType] || 3;
    }
    
    calculateMobCount(instance) {
        const dungeonConfig = this.dungeonTypes[instance.type];
        const baseCount = 5;
        return Math.floor(baseCount * dungeonConfig.difficulty * (1 + instance.currentRoom * 0.2));
    }
    
    getAveragePlayerLevel(instance) {
        const players = Array.from(instance.players.values());
        if (players.length === 0) return 1;
        
        const totalLevel = players.reduce((sum, player) => sum + player.level, 0);
        return Math.floor(totalLevel / players.length);
    }
    
    generateRandomPosition(instance) {
        // Simple position generation within instance bounds
        return {
            x: 100 + Math.random() * 600,
            y: 100 + Math.random() * 400
        };
    }
    
    generateBossPosition(instance) {
        // Generate boss position (usually center of room)
        return {
            x: 400,
            y: 300
        };
    }
    
    getDungeonEntrance(instance) {
        // Return entrance position
        return {
            x: 50,
            y: 50
        };
    }
    
    getRandomMobType() {
        const types = ['goblin', 'orc', 'skeleton', 'wolf', 'spider'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    getRandomBossType() {
        const types = ['dragon', 'demon', 'lich', 'giant', 'hydra'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    calculateMobHealth(level) {
        return Math.floor(50 * Math.pow(1.1, level));
    }
    
    calculateMobAttack(level) {
        return Math.floor(10 * Math.pow(1.08, level));
    }
    
    calculateMobDefense(level) {
        return Math.floor(5 * Math.pow(1.06, level));
    }
    
    calculateBossHealth(level) {
        return Math.floor(200 * Math.pow(1.15, level));
    }
    
    calculateBossAttack(level) {
        return Math.floor(25 * Math.pow(1.12, level));
    }
    
    calculateBossDefense(level) {
        return Math.floor(15 * Math.pow(1.1, level));
    }
    
    calculateMobXP(mob) {
        return Math.floor(mob.level * 15 * (1 + Math.random() * 0.5));
    }
    
    generateInstanceLoot(instance, mob) {
        return this.server.systems.itemSystem?.generateLoot(mob.level, mob.type) || [];
    }
    
    generateBossLoot(instance, boss) {
        const loot = this.server.systems.itemSystem?.generateLoot(boss.level, boss.type) || [];
        
        // Add boss-specific loot
        loot.push({
            id: 'boss_token',
            name: 'Boss Token',
            type: 'material',
            rarity: 'epic',
            quantity: 1,
            value: 1000
        });
        
        return loot;
    }
    
    giveXPToPlayer(player, amount) {
        player.xp += amount;
        
        // Check for level up
        const xpNeeded = this.calculateXPNeeded(player.level);
        if (player.xp >= xpNeeded) {
            player.level++;
            player.xp -= xpNeeded;
            this.handleLevelUp(player);
        }
    }
    
    calculateXPNeeded(level) {
        return Math.floor(100 * Math.pow(1.2, level - 1));
    }
    
    handleLevelUp(player) {
        // Increase stats
        player.maxHealth += 10;
        player.health = player.maxHealth;
        player.maxMana += 5;
        player.mana = player.maxMana;
        player.attack += 2;
        player.defense += 1;
        
        // Notify player
        const socket = this.server.getPlayerSocket(player.id);
        if (socket) {
            socket.emit('levelUp', {
                newLevel: player.level,
                stats: {
                    health: player.maxHealth,
                    mana: player.maxMana,
                    attack: player.attack,
                    defense: player.defense
                }
            });
        }
    }
    
    broadcastToInstance(instanceId, event, data, excludePlayer = null) {
        const instance = this.instances.get(instanceId);
        if (!instance) return;
        
        for (const [playerId] of instance.players) {
            if (playerId === excludePlayer) continue;
            
            const socket = this.server.getPlayerSocket(playerId);
            if (socket) {
                socket.emit(event, data);
            }
        }
    }
    
    startCleanupTimer() {
        setInterval(() => {
            this.cleanupExpiredInstances();
        }, this.config.cleanupInterval);
    }
    
    cleanupExpiredInstances() {
        const now = Date.now();
        
        for (const [instanceId, instance] of this.instances) {
            if (now >= instance.expiresAt) {
                this.closeInstance(instanceId);
            }
        }
    }
    
    // Public API
    getPlayerInstance(playerId) {
        const instanceId = this.playerInstances.get(playerId);
        return instanceId ? this.instances.get(instanceId) : null;
    }
    
    isPlayerInDungeon(playerId) {
        return this.playerInstances.has(playerId);
    }
    
    getInstanceInfo(instanceId) {
        const instance = this.instances.get(instanceId);
        if (!instance) return null;
        
        const dungeonConfig = this.dungeonTypes[instance.type];
        
        return {
            id: instance.id,
            type: instance.type,
            name: dungeonConfig.name,
            players: instance.players.size,
            maxPlayers: dungeonConfig.maxPlayers,
            mobsRemaining: instance.mobs.size,
            bossAlive: !!instance.boss,
            completed: instance.completed,
            timeRemaining: Math.max(0, instance.expiresAt - Date.now())
        };
    }
    
    // Cleanup
    cleanup() {
        // Close all instances
        for (const [instanceId] of this.instances) {
            this.closeInstance(instanceId);
        }
        
        this.instances.clear();
        this.playerInstances.clear();
        
        console.log('Dungeon Instance System cleanup complete');
    }
}

module.exports = DungeonInstance;
