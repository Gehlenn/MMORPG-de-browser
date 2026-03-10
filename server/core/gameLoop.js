/**
 * Game Loop System - MMO Server Tick Architecture
 * Handles server ticks, player updates, combat, AI, and events
 * Version 0.3.4 - Dynamic World Events and MMO Game Loop
 * Version 0.4.0 - ECS Integration
 */

const { getECSManager } = require('../ecs/ECSManager');
const MovementSystem = require('../systems/MovementSystem');
const CombatSystem = require('../systems/CombatSystem');
const AISystem = require('../systems/AISystem');
const InterestManager = require('../network/InterestManager');
const SnapshotSystem = require('../network/SnapshotSystem');
const DeltaCompressor = require('../network/DeltaCompressor');

class GameLoop {
    constructor(server) {
        this.server = server;
        
        // Game loop configuration
        this.config = {
            tickRate: 20, // 20 ticks per second (50ms per tick)
            tickInterval: 50, // milliseconds
            updateRadius: 300, // pixels - only send updates to nearby players
            batchSize: 50, // maximum players to process per batch
            aiUpdateInterval: 5, // update AI every 5 ticks
            eventUpdateInterval: 10, // update events every 10 ticks
            cleanupInterval: 600, // cleanup every 30 seconds (600 ticks)
            performanceMonitoring: true
        };
        
        // Game loop state
        this.isRunning = false;
        this.tickCount = 0;
        this.lastTickTime = 0;
        this.tickTimes = [];
        this.performanceStats = {
            avgTickTime: 0,
            maxTickTime: 0,
            minTickTime: Infinity,
            totalTicks: 0,
            droppedTicks: 0
        };
        
        // Update queues for batching
        this.playerUpdateQueue = new Map(); // playerId -> update data
        this.combatUpdateQueue = new Map(); // combatId -> update data
        this.mobUpdateQueue = new Map(); // mobId -> update data
        this.eventUpdateQueue = new Map(); // eventId -> update data
        
        // Spatial indexing for optimization
        this.spatialGrid = new SpatialGrid(100); // 100px grid cells
        
        // ECS System
        this.ecsManager = null;
        
        // Network Systems
        this.interestManager = null;
        this.snapshotSystem = null;
        this.deltaCompressor = null;
        
        // Initialize
        this.initialize();
    }
    
    async initialize() {
        // Initialize ECS Manager
        this.ecsManager = getECSManager();
        await this.ecsManager.initialize();
        
        // Register ECS systems
        const movementSystem = new MovementSystem(
            this.ecsManager.entityManager,
            this.ecsManager.componentManager
        );
        
        const combatSystem = new CombatSystem(
            this.ecsManager.entityManager,
            this.ecsManager.componentManager
        );
        
        const aiSystem = new AISystem(
            this.ecsManager.entityManager,
            this.ecsManager.componentManager
        );
        
        // Add systems to ECS manager with priorities
        this.ecsManager.addSystem(movementSystem, 1); // Movement first
        this.ecsManager.addSystem(combatSystem, 2);    // Combat second
        this.ecsManager.addSystem(aiSystem, 3);       // AI third
        
        // Initialize Network Systems
        this.interestManager = new InterestManager(
            this.ecsManager.spatialGrid,
            this.ecsManager.componentManager
        );
        
        this.snapshotSystem = new SnapshotSystem(
            this.ecsManager.componentManager,
            this.interestManager
        );
        
        this.deltaCompressor = new DeltaCompressor();
        
        // Setup event handlers
        this.setupEventHandlers();
        
        console.log('Game Loop System initialized with ECS and Networking');
    }
    
    setupEventHandlers() {
        // Player movement events
        this.server.on('playerMove', (socket, data) => {
            this.handlePlayerMove(socket, data);
        });
        
        // Combat events
        this.server.on('combatAction', (socket, data) => {
            this.handleCombatAction(socket, data);
        });
        
        // System ready event
        this.server.on('systemsReady', () => {
            this.start();
        });
    }
    
    start() {
        if (this.isRunning) {
            console.log('Game loop is already running');
            return;
        }
        
        this.isRunning = true;
        this.lastTickTime = Date.now();
        
        // Start the game loop
        this.gameLoopInterval = setInterval(() => {
            this.tick();
        }, this.config.tickInterval);
        
        // Start performance monitoring
        if (this.config.performanceMonitoring) {
            this.performanceInterval = setInterval(() => {
                this.updatePerformanceStats();
            }, 5000); // Update stats every 5 seconds
        }
        
        console.log(`Game loop started at ${this.config.tickRate} ticks per second`);
    }
    
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }
        
        if (this.performanceInterval) {
            clearInterval(this.performanceInterval);
            this.performanceInterval = null;
        }
        
        console.log('Game loop stopped');
    }
    
    tick() {
        const tickStartTime = Date.now();
        
        try {
            // Increment tick counter
            this.tickCount++;
            
            // Calculate delta time in milliseconds
            const deltaTime = this.tickCount > 1 ? 
                Date.now() - this.lastTickTime : 
                this.config.tickInterval;
            
            // Update ECS systems
            if (this.ecsManager) {
                this.ecsManager.update(deltaTime);
            }
            
            // Update spatial grid
            this.updateSpatialGrid();
            
            // Process game systems (legacy - will be migrated to ECS)
            this.updatePlayers();
            this.updateCombat();
            this.updateAI();
            this.updateEvents();
            this.updateSpawns();
            
            // Network Update Loop
            this.updateNetworkLoop();
            
            // Process queued updates
            this.processUpdateQueues();
            
            // Cleanup tasks
            if (this.tickCount % this.config.cleanupInterval === 0) {
                this.performCleanup();
            }
            
            // Record performance
            this.lastTickTime = Date.now();
            const tickTime = this.lastTickTime - tickStartTime;
            this.recordTickPerformance(tickTime);
            
        } catch (error) {
            console.error('Error in game loop tick:', error);
            this.performanceStats.droppedTicks++;
        }
    }
    
    /**
     * Network Update Loop
     * Handles interest management, snapshots, and delta compression
     */
    updateNetworkLoop() {
        // Get all connected players
        const playerIds = Array.from(this.server.players.keys());
        
        if (playerIds.length === 0) return;
        
        // Update interest management
        this.interestManager.updateAllPlayers(playerIds);
        
        // Check if snapshot should be created
        if (this.snapshotSystem.shouldCreateSnapshot(Date.now())) {
            // Create world snapshots
            const snapshots = this.snapshotSystem.createWorldSnapshot(playerIds);
            
            // Compress and send snapshots
            this.sendSnapshotsToClients(snapshots);
        }
    }
    
    /**
     * Send compressed snapshots to clients
     * @param {Map<number, object>} snapshots - Player snapshots
     */
    sendSnapshotsToClients(snapshots) {
        for (const [playerId, snapshot] of snapshots) {
            // Compress snapshot
            const compressedSnapshot = this.deltaCompressor.compressSnapshot(snapshot, playerId);
            
            if (compressedSnapshot) {
                // Send to client
                this.sendSnapshotToClient(playerId, compressedSnapshot);
            }
        }
    }
    
    /**
     * Send snapshot to specific client
     * @param {number} playerId - Player ID
     * @param {object} snapshot - Snapshot data
     */
    sendSnapshotToClient(playerId, snapshot) {
        const player = this.server.players.get(playerId);
        if (player && player.socket) {
            player.socket.emit('worldSnapshot', snapshot);
        }
    }
    
    updateSpatialGrid() {
        // Clear spatial grid
        this.spatialGrid.clear();
        
        // Add players to spatial grid
        for (const [playerId, player] of this.server.players) {
            if (!player.name) continue;
            
            this.spatialGrid.insert(playerId, {
                x: player.x,
                y: player.y,
                type: 'player',
                data: player
            });
        }
        
        // Add mobs to spatial grid
        if (this.server.systems.spawnSystem) {
            for (const mob of this.server.systems.spawnSystem.getMobs()) {
                this.spatialGrid.insert(mob.id, {
                    x: mob.x,
                    y: mob.y,
                    type: 'mob',
                    data: mob
                });
            }
        }
        
        // Add event entities to spatial grid
        if (this.server.systems.worldEvents) {
            for (const event of this.server.systems.worldEvents.getActiveEvents()) {
                this.spatialGrid.insert(event.id, {
                    x: event.x,
                    y: event.y,
                    type: 'event',
                    data: event
                });
            }
        }
    }
    
    updatePlayers() {
        const players = Array.from(this.server.players.values());
        
        // Process players in batches
        for (let i = 0; i < players.length; i += this.config.batchSize) {
            const batch = players.slice(i, i + this.config.batchSize);
            
            for (const player of batch) {
                if (!player.name) continue;
                
                this.updatePlayer(player);
            }
        }
    }
    
    updatePlayer(player) {
        // Update player regeneration
        this.updatePlayerRegeneration(player);
        
        // Update player buffs/debuffs
        this.updatePlayerEffects(player);
        
        // Update player position validation
        this.validatePlayerPosition(player);
        
        // Queue player update for nearby players
        this.queuePlayerUpdate(player);
    }
    
    updatePlayerRegeneration(player) {
        const now = Date.now();
        
        // Health regeneration
        if (player.health < player.maxHealth) {
            const healthRegen = this.calculateHealthRegeneration(player);
            player.health = Math.min(player.maxHealth, player.health + healthRegen);
        }
        
        // Mana regeneration
        if (player.mana < player.maxMana) {
            const manaRegen = this.calculateManaRegeneration(player);
            player.mana = Math.min(player.maxMana, player.mana + manaRegen);
        }
        
        // Apply blessing effects if active
        if (player.blessing && now < player.blessing.endTime) {
            const effects = player.blessing.effects;
            
            if (effects.healthRegen) {
                player.health = Math.min(player.maxHealth, player.health + effects.healthRegen);
            }
            
            if (effects.manaRegen) {
                player.mana = Math.min(player.maxMana, player.mana + effects.manaRegen);
            }
        } else if (player.blessing && now >= player.blessing.endTime) {
            // Remove expired blessing
            delete player.blessing;
            
            const socket = this.server.getPlayerSocket(player.id);
            if (socket) {
                socket.emit('blessingExpired', {});
            }
        }
    }
    
    updatePlayerEffects(player) {
        const now = Date.now();
        
        // Update buffs
        if (player.buffs) {
            for (const [stat, buff] of player.buffs) {
                if (now >= buff.endTime) {
                    // Remove expired buff
                    player.buffs.delete(stat);
                    
                    // Revert stat change
                    if (buff.multiplier) {
                        player[stat] = player[stat] / (1 + buff.value);
                    } else {
                        player[stat] = player[stat] - buff.value;
                    }
                }
            }
        }
        
        // Update debuffs
        if (player.debuffs) {
            for (const [stat, debuff] of player.debuffs) {
                if (now >= debuff.endTime) {
                    // Remove expired debuff
                    player.debuffs.delete(stat);
                    
                    // Revert stat change
                    if (debuff.multiplier) {
                        player[stat] = player[stat] / (1 - debuff.value);
                    } else {
                        player[stat] = player[stat] + debuff.value;
                    }
                }
            }
        }
        
        // Update damage over time
        if (player.dots) {
            for (const [dotId, dot] of player.dots) {
                if (now >= dot.endTime) {
                    player.dots.delete(dotId);
                } else if (now >= dot.lastTick + dot.interval) {
                    // Apply damage
                    player.health = Math.max(0, player.health - dot.damage);
                    dot.lastTick = now;
                    
                    // Check if player died
                    if (player.health <= 0) {
                        this.handlePlayerDeath(player);
                    }
                }
            }
        }
        
        // Update healing over time
        if (player.hots) {
            for (const [hotId, hot] of player.hots) {
                if (now >= hot.endTime) {
                    player.hots.delete(hotId);
                } else if (now >= hot.lastTick + hot.interval) {
                    // Apply healing
                    player.health = Math.min(player.maxHealth, player.health + hot.healing);
                    hot.lastTick = now;
                }
            }
        }
    }
    
    validatePlayerPosition(player) {
        // Basic boundary checking
        const worldBounds = {
            minX: 0,
            maxX: 2000,
            minY: 0,
            maxY: 2000
        };
        
        // Clamp position to world bounds
        player.x = Math.max(worldBounds.minX, Math.min(worldBounds.maxX, player.x));
        player.y = Math.max(worldBounds.minY, Math.min(worldBounds.maxY, player.y));
        
        // Check for collision with obstacles (simplified)
        if (this.checkCollision(player)) {
            // Revert to last valid position
            if (player.lastValidPosition) {
                player.x = player.lastValidPosition.x;
                player.y = player.lastValidPosition.y;
            }
        } else {
            // Update last valid position
            player.lastValidPosition = { x: player.x, y: player.y };
        }
    }
    
    checkCollision(entity) {
        // Simplified collision checking
        // In a real implementation, this would check against world geometry
        return false;
    }
    
    updateCombat() {
        // Update active combat encounters
        if (this.server.systems.combatSystem) {
            this.server.systems.combatSystem.updateCombat();
        }
        
        // Update skill system
        if (this.server.systems.skillSystem) {
            this.server.systems.skillSystem.updateActiveEffects();
        }
    }
    
    updateAI() {
        // Update AI every few ticks for performance
        if (this.tickCount % this.config.aiUpdateInterval !== 0) return;
        
        // Update mob AI
        if (this.server.systems.spawnSystem) {
            this.updateMobAI();
        }
        
        // Update NPC AI
        if (this.server.systems.npcSystem) {
            this.server.systems.npcSystem.updateAI();
        }
    }
    
    updateMobAI() {
        const mobs = this.server.systems.spawnSystem.getMobs();
        
        for (const mob of mobs) {
            // Find nearby players
            const nearbyPlayers = this.spatialGrid.queryRadius(mob.x, mob.y, 200)
                .filter(entity => entity.type === 'player')
                .map(entity => entity.data);
            
            if (nearbyPlayers.length > 0) {
                // Simple AI: move towards nearest player
                const target = nearbyPlayers[0];
                const dx = target.x - mob.x;
                const dy = target.y - mob.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 50) { // Attack range
                    // Move towards target
                    const moveSpeed = 2;
                    mob.x += (dx / distance) * moveSpeed;
                    mob.y += (dy / distance) * moveSpeed;
                    
                    // Queue mob update
                    this.queueMobUpdate(mob);
                }
            }
        }
    }
    
    updateEvents() {
        // Update events every few ticks
        if (this.tickCount % this.config.eventUpdateInterval !== 0) return;
        
        if (this.server.systems.worldEvents) {
            // Update event participants
            this.updateEventParticipants();
            
            // Update event blessings
            this.updateEventBlessings();
        }
    }
    
    updateEventParticipants() {
        for (const event of this.server.systems.worldEvents.getActiveEvents()) {
            const nearbyPlayers = this.spatialGrid.queryRadius(event.x, event.y, 500)
                .filter(entity => entity.type === 'player')
                .map(entity => entity.data);
            
            // Check for new participants
            for (const player of nearbyPlayers) {
                if (player.level >= event.minLevel && !event.participants.has(player.id)) {
                    // Auto-join nearby players to event
                    this.server.systems.worldEvents.handlePlayerJoinedEvent(
                        this.server.getPlayerSocket(player.id),
                        { eventId: event.id }
                    );
                }
            }
        }
    }
    
    updateEventBlessings() {
        for (const event of this.server.systems.worldEvents.getActiveEvents()) {
            if (event.type === 'celestial_blessing' && event.blessing) {
                // Reapply blessing effects to nearby players
                this.server.systems.worldEvents.applyBlessingEffects(event);
            }
        }
    }
    
    updateSpawns() {
        // Update spawn system
        if (this.server.systems.spawnSystem) {
            this.server.systems.spawnSystem.update();
        }
        
        // Update dungeon instances
        if (this.server.systems.dungeonInstance) {
            this.updateDungeonInstances();
        }
    }
    
    updateDungeonInstances() {
        // Update dungeon mob respawns and state
        for (const instance of this.server.systems.dungeonInstance.instances.values()) {
            // Update instance state based on player activity
            const nearbyPlayers = this.spatialGrid.queryRadius(instance.x || 400, instance.y || 300, 500)
                .filter(entity => entity.type === 'player')
                .map(entity => entity.data);
            
            if (nearbyPlayers.length > 0) {
                instance.lastActivity = Date.now();
            }
        }
    }
    
    processUpdateQueues() {
        // Process player updates
        this.processPlayerUpdateQueue();
        
        // Process mob updates
        this.processMobUpdateQueue();
        
        // Process event updates
        this.processEventUpdateQueue();
        
        // Clear queues
        this.playerUpdateQueue.clear();
        this.mobUpdateQueue.clear();
        this.eventUpdateQueue.clear();
    }
    
    processPlayerUpdateQueue() {
        for (const [playerId, updateData] of this.playerUpdateQueue) {
            const player = this.server.players.get(playerId);
            if (!player) continue;
            
            // Find nearby players
            const nearbyPlayers = this.spatialGrid.queryRadius(player.x, player.y, this.config.updateRadius)
                .filter(entity => entity.type === 'player' && entity.id !== playerId)
                .map(entity => entity.id);
            
            // Send update to nearby players
            for (const nearbyPlayerId of nearbyPlayers) {
                const socket = this.server.getPlayerSocket(nearbyPlayerId);
                if (socket) {
                    socket.emit('playerUpdate', {
                        playerId: playerId,
                        x: player.x,
                        y: player.y,
                        health: player.health,
                        maxHealth: player.maxHealth,
                        mana: player.mana,
                        maxMana: player.maxMana
                    });
                }
            }
        }
    }
    
    processMobUpdateQueue() {
        for (const [mobId, updateData] of this.mobUpdateQueue) {
            // Find nearby players
            const mob = this.spatialGrid.get(mobId);
            if (!mob) continue;
            
            const nearbyPlayers = this.spatialGrid.queryRadius(mob.x, mob.y, this.config.updateRadius)
                .filter(entity => entity.type === 'player')
                .map(entity => entity.id);
            
            // Send update to nearby players
            for (const playerId of nearbyPlayers) {
                const socket = this.server.getPlayerSocket(playerId);
                if (socket) {
                    socket.emit('mobUpdate', {
                        mobId: mobId,
                        x: mob.x,
                        y: mob.y,
                        health: mob.data.health,
                        maxHealth: mob.data.maxHealth
                    });
                }
            }
        }
    }
    
    processEventUpdateQueue() {
        for (const [eventId, updateData] of this.eventUpdateQueue) {
            // Find nearby players
            const event = this.spatialGrid.get(eventId);
            if (!event) continue;
            
            const nearbyPlayers = this.spatialGrid.queryRadius(event.x, event.y, this.config.updateRadius)
                .filter(entity => entity.type === 'player')
                .map(entity => entity.id);
            
            // Send update to nearby players
            for (const playerId of nearbyPlayers) {
                const socket = this.server.getPlayerSocket(playerId);
                if (socket) {
                    socket.emit('eventUpdate', {
                        eventId: eventId,
                        updateData: updateData
                    });
                }
            }
        }
    }
    
    queuePlayerUpdate(player) {
        this.playerUpdateQueue.set(player.id, {
            x: player.x,
            y: player.y,
            health: player.health,
            mana: player.mana,
            lastUpdate: Date.now()
        });
    }
    
    queueMobUpdate(mob) {
        this.mobUpdateQueue.set(mob.id, {
            x: mob.x,
            y: mob.y,
            health: mob.health,
            lastUpdate: Date.now()
        });
    }
    
    queueEventUpdate(eventId, updateData) {
        this.eventUpdateQueue.set(eventId, {
            ...updateData,
            lastUpdate: Date.now()
        });
    }
    
    performCleanup() {
        // Clean up disconnected players
        this.cleanupDisconnectedPlayers();
        
        // Clean up expired entities
        this.cleanupExpiredEntities();
        
        // Optimize spatial grid
        this.spatialGrid.optimize();
        
        // Log performance stats
        this.logPerformanceStats();
    }
    
    cleanupDisconnectedPlayers() {
        // This is handled by individual systems
        // Just a placeholder for coordination
    }
    
    cleanupExpiredEntities() {
        // Clean up expired temporary entities
        const now = Date.now();
        
        // Clean up temporary effects
        for (const [playerId, player] of this.server.players) {
            if (player.tempEffects) {
                for (const [effectId, effect] of player.tempEffects) {
                    if (now >= effect.expiresAt) {
                        player.tempEffects.delete(effectId);
                    }
                }
            }
        }
    }
    
    handlePlayerMove(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        // Validate movement
        const distance = Math.sqrt(
            Math.pow(data.x - player.x, 2) + 
            Math.pow(data.y - player.y, 2)
        );
        
        const maxDistance = 150; // Max movement per tick
        if (distance > maxDistance) {
            // Reject invalid movement
            socket.emit('movementRejected', {
                x: player.x,
                y: player.y
            });
            return;
        }
        
        // Update position
        player.x = data.x;
        player.y = data.y;
        
        // Queue update
        this.queuePlayerUpdate(player);
    }
    
    handleCombatAction(socket, data) {
        // Forward to combat system
        if (this.server.systems.combatSystem) {
            this.server.systems.combatSystem.handleCombatAction(socket, data);
        }
    }
    
    handlePlayerDeath(player) {
        // Handle player death
        player.health = 0;
        
        // Notify nearby players
        const nearbyPlayers = this.spatialGrid.queryRadius(player.x, player.y, this.config.updateRadius)
            .filter(entity => entity.type === 'player')
            .map(entity => entity.id);
        
        for (const playerId of nearbyPlayers) {
            const socket = this.server.getPlayerSocket(playerId);
            if (socket) {
                socket.emit('playerDeath', {
                    playerId: player.id
                });
            }
        }
        
        // Respawn player (simplified)
        setTimeout(() => {
            this.respawnPlayer(player);
        }, 5000);
    }
    
    respawnPlayer(player) {
        // Reset player state
        player.health = player.maxHealth;
        player.mana = player.maxMana;
        player.x = 400; // Resawn point
        player.y = 300;
        
        // Notify player
        const socket = this.server.getPlayerSocket(player.id);
        if (socket) {
            socket.emit('playerRespawn', {
                x: player.x,
                y: player.y,
                health: player.health,
                mana: player.mana
            });
        }
        
        // Queue update
        this.queuePlayerUpdate(player);
    }
    
    // Utility methods
    calculateHealthRegeneration(player) {
        let regen = 1; // Base regeneration
        
        // Add vitality bonus
        if (player.attributes && player.attributes.VIT) {
            regen += Math.floor(player.attributes.VIT / 10);
        }
        
        // Add equipment bonus
        if (player.equipment) {
            for (const item of Object.values(player.equipment)) {
                if (item.stats && item.stats.healthRegen) {
                    regen += item.stats.healthRegen;
                }
            }
        }
        
        return regen;
    }
    
    calculateManaRegeneration(player) {
        let regen = 0.5; // Base regeneration
        
        // Add wisdom bonus
        if (player.attributes && player.attributes.WIS) {
            regen += Math.floor(player.attributes.WIS / 15);
        }
        
        // Add equipment bonus
        if (player.equipment) {
            for (const item of Object.values(player.equipment)) {
                if (item.stats && item.stats.manaRegen) {
                    regen += item.stats.manaRegen;
                }
            }
        }
        
        return regen;
    }
    
    recordTickPerformance(tickTime) {
        this.tickTimes.push(tickTime);
        
        // Keep only last 100 tick times for rolling average
        if (this.tickTimes.length > 100) {
            this.tickTimes.shift();
        }
        
        // Update min/max
        this.performanceStats.maxTickTime = Math.max(this.performanceStats.maxTickTime, tickTime);
        this.performanceStats.minTickTime = Math.min(this.performanceStats.minTickTime, tickTime);
    }
    
    updatePerformanceStats() {
        if (this.tickTimes.length === 0) return;
        
        // Calculate average tick time
        const sum = this.tickTimes.reduce((a, b) => a + b, 0);
        this.performanceStats.avgTickTime = sum / this.tickTimes.length;
        
        // Calculate tick rate
        const actualTickRate = 1000 / this.performanceStats.avgTickTime;
        
        // Log if performance is poor
        if (actualTickRate < this.config.tickRate * 0.9) {
            console.warn(`Game loop performance degraded: ${actualTickRate.toFixed(1)} ticks/sec (target: ${this.config.tickRate})`);
        }
    }
    
    logPerformanceStats() {
        console.log(`Game Loop Performance (last ${this.tickTimes.length} ticks):`);
        console.log(`  Average tick time: ${this.performanceStats.avgTickTime.toFixed(2)}ms`);
        console.log(`  Max tick time: ${this.performanceStats.maxTickTime.toFixed(2)}ms`);
        console.log(`  Min tick time: ${this.performanceStats.minTickTime.toFixed(2)}ms`);
        console.log(`  Total ticks: ${this.performanceStats.totalTicks}`);
        console.log(`  Dropped ticks: ${this.performanceStats.droppedTicks}`);
        
        // Reset min for next period
        this.performanceStats.minTickTime = Infinity;
    }
    
    // Public API
    getPerformanceStats() {
        return {
            ...this.performanceStats,
            currentTickRate: this.tickTimes.length > 0 ? 
                1000 / this.performanceStats.avgTickTime : 0,
            targetTickRate: this.config.tickRate,
            isRunning: this.isRunning,
            tickCount: this.tickCount
        };
    }
    
    getSpatialGrid() {
        return this.spatialGrid;
    }
    
    // Cleanup
    cleanup() {
        this.stop();
        
        // Clear queues
        this.playerUpdateQueue.clear();
        this.combatUpdateQueue.clear();
        this.mobUpdateQueue.clear();
        this.eventUpdateQueue.clear();
        
        // Clear spatial grid
        this.spatialGrid.clear();
        
        console.log('Game Loop System cleanup complete');
    }
}

/**
 * Spatial Grid for spatial indexing and optimization
 */
class SpatialGrid {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.grid = new Map(); // cellKey -> Set of entities
    }
    
    clear() {
        this.grid.clear();
    }
    
    insert(id, entity) {
        const cellKey = this.getCellKey(entity.x, entity.y);
        
        if (!this.grid.has(cellKey)) {
            this.grid.set(cellKey, new Set());
        }
        
        this.grid.get(cellKey).add({ id, ...entity });
    }
    
    remove(id, entity) {
        const cellKey = this.getCellKey(entity.x, entity.y);
        const cell = this.grid.get(cellKey);
        
        if (cell) {
            cell.delete(id);
            if (cell.size === 0) {
                this.grid.delete(cellKey);
            }
        }
    }
    
    queryRadius(x, y, radius) {
        const results = [];
        const cellRadius = Math.ceil(radius / this.cellSize);
        const centerCellX = Math.floor(x / this.cellSize);
        const centerCellY = Math.floor(y / this.cellSize);
        
        for (let dx = -cellRadius; dx <= cellRadius; dx++) {
            for (let dy = -cellRadius; dy <= cellRadius; dy++) {
                const cellKey = `${centerCellX + dx},${centerCellY + dy}`;
                const cell = this.grid.get(cellKey);
                
                if (cell) {
                    for (const entity of cell) {
                        const distance = Math.sqrt(
                            Math.pow(entity.x - x, 2) + 
                            Math.pow(entity.y - y, 2)
                        );
                        
                        if (distance <= radius) {
                            results.push(entity);
                        }
                    }
                }
            }
        }
        
        return results;
    }
    
    getCellKey(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }
    
    /**
     * Spawn ECS entities (helper functions)
     */
    spawnECSPlayer(playerId, x, y) {
        if (!this.ecsManager) return null;
        
        const ecsEntityId = this.ecsManager.spawnPlayer(x, y, {
            combat: { level: 1, attack: 15, defense: 10 },
            health: { hp: 100, maxHp: 100 }
        });
        
        // Map player ID to ECS entity ID
        this.playerECSMapping = this.playerECSMapping || new Map();
        this.playerECSMapping.set(playerId, ecsEntityId);
        
        console.log(`Spawned ECS player ${ecsEntityId} for player ${playerId} at (${x}, ${y})`);
        return ecsEntityId;
    }
    
    spawnECSMob(x, y, level = 1) {
        if (!this.ecsManager) return null;
        
        const ecsEntityId = this.ecsManager.spawnMob(x, y, level);
        console.log(`Spawned ECS mob ${ecsEntityId} at (${x}, ${y}) level ${level}`);
        return ecsEntityId;
    }
    
    spawnECSNPC(x, y, npcType = 'merchant') {
        if (!this.ecsManager) return null;
        
        const ecsEntityId = this.ecsManager.spawnNPC(x, y, {
            combat: { level: 1, attack: 0, defense: 0 },
            health: { hp: 100, maxHp: 100 }
        });
        
        console.log(`Spawned ECS NPC ${ecsEntityId} (${npcType}) at (${x}, ${y})`);
        return ecsEntityId;
    }
    
    /**
     * Get ECS entity ID for player
     */
    getPlayerECSId(playerId) {
        return this.playerECSMapping ? this.playerECSMapping.get(playerId) : null;
    }
    
    /**
     * Remove player from ECS
     */
    removePlayerFromECS(playerId) {
        if (!this.playerECSMapping) return;
        
        const ecsEntityId = this.playerECSMapping.get(playerId);
        if (ecsEntityId && this.ecsManager) {
            this.ecsManager.removeEntity(ecsEntityId);
            this.playerECSMapping.delete(playerId);
            console.log(`Removed ECS entity ${ecsEntityId} for player ${playerId}`);
        }
    }
    
    /**
     * Get ECS statistics
     */
    getECSStats() {
        if (!this.ecsManager) return null;
        
        return {
            ecs: this.ecsManager.getStats(),
            systems: this.ecsManager.getSystemInfo(),
            spatial: this.ecsManager.spatialGrid.getStats()
        };
    }
    
    /**
     * Get performance statistics
     */
    getPerformanceStats() {
        return {
            ...this.performanceStats,
            tickCount: this.tickCount,
            isRunning: this.isRunning,
            config: this.config,
            ecs: this.getECSStats()
        };
    }
}

module.exports = GameLoop;
