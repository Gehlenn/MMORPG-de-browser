/**
 * DraconiaIntegration.js
 * 
 * Main integration system for Draconia zone
 * Connects all components: zone, environment, mobs, boss, transitions, and crafting
 */

const EventEmitter = require('events');
const DraconiaZone = require('./DraconiaZone');
const DraconiaEnvironment = require('./DraconiaEnvironment');
const AncientDragonKrazgoth = require('../bosses/AncientDragonKrazgoth');

// Mob classes
const MagmaCrab = require('../mobs/draconia/MagmaCrab');
const FrostWolf = require('../mobs/draconia/FrostWolf');
const SteamElemental = require('../mobs/draconia/SteamElemental');
const Wyvern = require('../mobs/draconia/Wyvern');
const Harpy = require('../mobs/draconia/Harpy');
const MountainGriffin = require('../mobs/draconia/MountainGriffin');
const MagmaGolem = require('../mobs/draconia/MagmaGolem');
const FireDrake = require('../mobs/draconia/FireDrake');
const LavaSerpent = require('../mobs/draconia/LavaSerpent');

class DraconiaIntegration extends EventEmitter {
    constructor(database, server) {
        super();
        this.db = database;
        this.server = server;
        
        // Core systems
        this.zone = null;
        this.environment = null;
        this.boss = null;
        
        // Mob management
        this.mobs = new Map();
        this.spawnedMobs = new Map();
        this.nextMobId = 1;
        
        // Spawn configurations
        this.spawnConfigs = this.setupSpawnConfigs();
        
        // Boss management
        this.bossSpawned = false;
        this.bossCooldown = 7 * 24 * 60 * 60 * 1000; // 7 days
        this.lastBossKill = null;
        
        // Update loop
        this.updateInterval = null;
        
        this.initialized = false;
    }
    
    async initialize() {
        console.log('[DraconiaIntegration] Initializing Draconia zone...');
        
        // Initialize zone
        this.zone = new DraconiaZone(this.db, this, null);
        await this.zone.initialize();
        
        // Initialize environment
        this.environment = new DraconiaEnvironment(this.db, this.zone);
        await this.environment.initialize();
        
        // Setup event handlers
        this.setupEventHandlers();
        
        // Start spawn loops
        this.startSpawnLoops();
        
        // Start update loop
        this.startUpdateLoop();
        
        this.initialized = true;
        console.log('[DraconiaIntegration] Draconia zone fully initialized');
        this.emit('initialized');
        return true;
    }
    
    setupSpawnConfigs() {
        return {
            // Tier 1: Frostfire Ridge (Levels 65-68)
            magma_crab: {
                mobClass: MagmaCrab,
                count: 8,
                subZone: 'frostfire_ridge',
                positions: [
                    { x: 1400, y: 950 }, { x: 1500, y: 1000 },
                    { x: 1600, y: 1050 }, { x: 1450, y: 1100 },
                    { x: 1550, y: 950 }, { x: 1480, y: 1020 },
                    { x: 1620, y: 980 }, { x: 1520, y: 1080 }
                ],
                respawnTime: 5 * 60 * 1000 // 5 minutes
            },
            frost_wolf: {
                mobClass: FrostWolf,
                count: 6,
                subZone: 'frostfire_ridge',
                positions: [
                    { x: 1650, y: 900 }, { x: 1700, y: 950 },
                    { x: 1750, y: 1000 }, { x: 1680, y: 1050 },
                    { x: 1720, y: 1100 }, { x: 1780, y: 950 }
                ],
                packIds: [1, 1, 1, 2, 2, 2], // Two packs of 3
                respawnTime: 4 * 60 * 1000
            },
            steam_elemental: {
                mobClass: SteamElemental,
                count: 5,
                subZone: 'frostfire_ridge',
                positions: [
                    { x: 1800, y: 900 }, { x: 1850, y: 950 },
                    { x: 1820, y: 1000 }, { x: 1880, y: 980 },
                    { x: 1840, y: 1050 }
                ],
                respawnTime: 6 * 60 * 1000
            },
            // Tier 2: Wyvern Heights (Levels 70-74)
            wyvern: {
                mobClass: Wyvern,
                count: 6,
                subZone: 'wyvern_heights',
                positions: [
                    { x: 2800, y: 800 }, { x: 3000, y: 900 },
                    { x: 2900, y: 1000 }, { x: 3100, y: 850 },
                    { x: 2850, y: 1100 }, { x: 3050, y: 1050 }
                ],
                respawnTime: 8 * 60 * 1000
            },
            harpy: {
                mobClass: Harpy,
                count: 8,
                subZone: 'wyvern_heights',
                positions: [
                    { x: 2700, y: 700 }, { x: 2950, y: 750 },
                    { x: 3150, y: 800 }, { x: 2750, y: 950 },
                    { x: 3200, y: 1000 }, { x: 2800, y: 1150 },
                    { x: 3000, y: 1200 }, { x: 3100, y: 1150 }
                ],
                respawnTime: 6 * 60 * 1000
            },
            mountain_griffin: {
                mobClass: MountainGriffin,
                count: 4,
                subZone: 'wyvern_heights',
                positions: [
                    { x: 2900, y: 700 }, { x: 3100, y: 950 },
                    { x: 2850, y: 1000 }, { x: 3050, y: 800 }
                ],
                respawnTime: 10 * 60 * 1000
            },
            // Tier 3: Volcanic Core (Levels 76-78)
            magma_golem: {
                mobClass: MagmaGolem,
                count: 4,
                subZone: 'volcanic_core',
                positions: [
                    { x: 3800, y: 1800 }, { x: 4000, y: 1900 },
                    { x: 3900, y: 2000 }, { x: 4100, y: 1800 }
                ],
                respawnTime: 12 * 60 * 1000
            },
            fire_drake: {
                mobClass: FireDrake,
                count: 5,
                subZone: 'volcanic_core',
                positions: [
                    { x: 3700, y: 1700 }, { x: 3900, y: 1750 },
                    { x: 4100, y: 1700 }, { x: 3850, y: 1850 },
                    { x: 4050, y: 1950 }
                ],
                respawnTime: 10 * 60 * 1000
            },
            lava_serpent: {
                mobClass: LavaSerpent,
                count: 6,
                subZone: 'volcanic_core',
                positions: [
                    { x: 3750, y: 1750 }, { x: 3950, y: 1800 },
                    { x: 4150, y: 1750 }, { x: 3800, y: 1900 },
                    { x: 4000, y: 2000 }, { x: 4200, y: 1900 }
                ],
                respawnTime: 8 * 60 * 1000
            }
        };
    }
    
    setupEventHandlers() {
        // Environment events
        this.environment.on('weatherChange', (data) => {
            this.broadcastToZone('weather_update', data);
        });
        
        this.environment.on('avalanche', (data) => {
            this.broadcastToZone('environment_hazard', { type: 'avalanche', ...data });
        });
        
        // Zone events
        this.zone.on('playerEntered', (data) => {
            this.handlePlayerEnter(data.playerId, data.playerData);
        });
        
        this.zone.on('resourceGathered', (data) => {
            this.handleResourceGathered(data.playerId, data.resourceId, data.loot);
        });
    }
    
    handlePlayerEnter(playerId, playerData) {
        // Send zone data to player
        if (this.server && this.server.sendToPlayer) {
            this.server.sendToPlayer(playerId, 'zone_data', {
                zone: this.zone.getClientZoneData(),
                environment: this.environment.getClientData()
            });
        }
        
        // Check if player can access boss
        if (this.canPlayerAccessBoss(playerId, playerData)) {
            this.spawnBossIfReady();
        }
    }
    
    handleResourceGathered(playerId, resourceId, loot) {
        // Log to database
        this.logResourceGathered(playerId, resourceId, loot);
    }
    
    canPlayerAccessBoss(playerId, playerData) {
        // Check level requirement
        if (!playerData.level || playerData.level < 60) return false;
        
        // Check if in correct sub-zone
        const subZone = this.zone.getSubZoneAt(playerData.x, playerData.y);
        return subZone && subZone.id === 'peak_of_ancients';
    }
    
    spawnBossIfReady() {
        if (this.bossSpawned) return false;
        
        // Check cooldown
        if (this.lastBossKill) {
            const timeSinceKill = Date.now() - this.lastBossKill;
            if (timeSinceKill < this.bossCooldown) return false;
        }
        
        // Spawn boss
        this.boss = new AncientDragonKrazgoth('krazgoth_draconia', 'draconia');
        this.setupBossHandlers();
        this.bossSpawned = true;
        
        console.log('[DraconiaIntegration] Ancient Dragon Krazgoth has spawned!');
        this.emit('bossSpawned', { bossId: this.boss.id, location: { x: this.boss.x, y: this.boss.y } });
        this.broadcastToZone('boss_spawned', {
            bossId: this.boss.id,
            name: this.boss.name,
            location: { x: this.boss.x, y: this.y },
            hp: this.boss.hp,
            maxHp: this.boss.maxHp
        });
        
        return true;
    }
    
    setupBossHandlers() {
        if (!this.boss) return;
        
        this.boss.on('combatStart', (data) => {
            this.broadcastToZone('boss_combat_start', data);
        });
        
        this.boss.on('phaseTransition', (data) => {
            this.broadcastToZone('boss_phase_transition', data);
        });
        
        this.boss.on('abilityUse', (data) => {
            this.broadcastToZone('boss_ability', data);
        });
        
        this.boss.on('death', (data) => {
            this.bossSpawned = false;
            this.lastBossKill = Date.now();
            this.broadcastToZone('boss_death', data);
            this.emit('bossKilled', data);
        });
    }
    
    startSpawnLoops() {
        // Initial spawn
        for (const [mobType, config] of Object.entries(this.spawnConfigs)) {
            this.spawnMobPack(mobType, config);
        }
        
        // Respawn loop
        setInterval(() => {
            this.checkRespawns();
        }, 30000); // Check every 30 seconds
    }
    
    spawnMobPack(mobType, config) {
        for (let i = 0; i < config.count; i++) {
            const mobId = `${mobType}_${this.nextMobId++}`;
            const position = config.positions[i] || this.getRandomPositionInSubZone(config.subZone);
            
            const mob = new config.mobClass(mobId, {
                x: position.x,
                y: position.y,
                subZone: config.subZone,
                packId: config.packIds ? config.packIds[i] : null
            }, 'draconia');
            
            mob.spawnTime = Date.now();
            mob.respawnTime = config.respawnTime;
            
            mob.on('death', () => {
                this.handleMobDeath(mobId, mobType);
            });
            
            this.spawnedMobs.set(mobId, mob);
            this.mobs.set(mobId, mob);
        }
    }
    
    handleMobDeath(mobId, mobType) {
        this.spawnedMobs.delete(mobId);
        this.mobs.delete(mobId);
        
        // Schedule respawn
        const config = this.spawnConfigs[mobType];
        if (config) {
            setTimeout(() => {
                this.respawnMob(mobType, config);
            }, config.respawnTime);
        }
    }
    
    respawnMob(mobType, config) {
        // Count current mobs of this type
        let currentCount = 0;
        for (const [id, mob] of this.spawnedMobs) {
            if (id.startsWith(mobType)) currentCount++;
        }
        
        // Spawn missing mobs
        const toSpawn = config.count - currentCount;
        for (let i = 0; i < toSpawn; i++) {
            const mobId = `${mobType}_${this.nextMobId++}`;
            const position = this.getRandomPositionInSubZone(config.subZone);
            
            const mob = new config.mobClass(mobId, {
                x: position.x,
                y: position.y,
                subZone: config.subZone
            }, 'draconia');
            
            mob.spawnTime = Date.now();
            mob.respawnTime = config.respawnTime;
            
            mob.on('death', () => {
                this.handleMobDeath(mobId, mobType);
            });
            
            this.spawnedMobs.set(mobId, mob);
            this.mobs.set(mobId, mob);
        }
    }
    
    checkRespawns() {
        for (const [mobType, config] of Object.entries(this.spawnConfigs)) {
            this.respawnMob(mobType, config);
        }
    }
    
    getRandomPositionInSubZone(subZoneId) {
        const subZone = this.zone.subZones[subZoneId];
        if (!subZone) return { x: 2000, y: 1000 };
        
        return {
            x: subZone.bounds.x + Math.random() * subZone.bounds.width,
            y: subZone.bounds.y + Math.random() * subZone.bounds.height
        };
    }
    
    startUpdateLoop() {
        this.updateInterval = setInterval(() => {
            this.update();
        }, 1000);
    }
    
    update() {
        // Cleanup dead mobs
        for (const [mobId, mob] of this.spawnedMobs) {
            if (mob.state === 'dead') {
                this.spawnedMobs.delete(mobId);
            }
        }
        
        // Send periodic zone updates
        if (Date.now() % 5000 < 1000) {
            this.broadcastZoneState();
        }
    }
    
    broadcastZoneState() {
        const mobData = [];
        for (const mob of this.spawnedMobs.values()) {
            mobData.push(mob.getClientData());
        }
        
        this.broadcastToZone('zone_state_update', {
            mobCount: this.spawnedMobs.size,
            mobs: mobData,
            bossActive: this.bossSpawned,
            bossData: this.boss ? this.boss.getClientData() : null
        });
    }
    
    broadcastToZone(event, data) {
        if (this.server && this.server.broadcastToZone) {
            this.server.broadcastToZone('draconia', event, data);
        }
        this.emit(event, data);
    }
    
    async logResourceGathered(playerId, resourceId, loot) {
        try {
            await this.db.run(`
                INSERT INTO draconia_crafting_resources (player_id, resource_id, quantity, gathered_at)
                VALUES (?, ?, ?, datetime('now'))
            `, [playerId, resourceId, JSON.stringify(loot)]);
        } catch (error) {
            console.error('[DraconiaIntegration] Error logging resource:', error);
        }
    }
    
    // Player management
    registerPlayer(playerId, playerData) {
        return this.zone.registerPlayer(playerId, playerData);
    }
    
    unregisterPlayer(playerId) {
        return this.zone.unregisterPlayer(playerId);
    }
    
    updatePlayerPosition(playerId, x, y) {
        return this.zone.updatePlayerPosition(playerId, x, y);
    }
    
    // Data export
    getZoneData() {
        return {
            zone: this.zone.getFullData(),
            environment: this.environment.getFullData(),
            mobs: {
                count: this.spawnedMobs.size,
                byType: this.getMobCountsByType()
            },
            boss: this.boss ? this.boss.getFullData() : null,
            bossAvailable: !this.bossSpawned && (!this.lastBossKill || 
                Date.now() - this.lastBossKill >= this.bossCooldown)
        };
    }
    
    getMobCountsByType() {
        const counts = {};
        for (const [mobId] of this.spawnedMobs) {
            const type = mobId.split('_')[0];
            counts[type] = (counts[type] || 0) + 1;
        }
        return counts;
    }
    
    getStatistics() {
        return {
            zone: this.zone.getStatistics(),
            environment: {
                currentWeather: this.environment.currentWeather,
                activeHazards: this.environment.thermalVents.filter(v => v.active).length +
                              this.environment.iceFissures.filter(f => f.active).length
            },
            mobs: {
                totalSpawned: this.spawnedMobs.size,
                bySubZone: this.getMobsBySubZone()
            },
            boss: {
                spawned: this.bossSpawned,
                lastKill: this.lastBossKill,
                nextSpawnAvailable: this.lastBossKill ? 
                    new Date(this.lastBossKill + this.bossCooldown).toISOString() : 'Now'
            }
        };
    }
    
    getMobsBySubZone() {
        const byZone = {};
        for (const mob of this.spawnedMobs.values()) {
            byZone[mob.subZone] = (byZone[mob.subZone] || 0) + 1;
        }
        return byZone;
    }
    
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        for (const mob of this.spawnedMobs.values()) {
            mob.cleanup();
        }
        this.spawnedMobs.clear();
        this.mobs.clear();
        
        if (this.boss) {
            this.boss.cleanup();
        }
        
        if (this.environment) {
            this.environment.cleanup();
        }
        
        if (this.zone) {
            this.zone.cleanup();
        }
        
        this.removeAllListeners();
        console.log('[DraconiaIntegration] Draconia integration cleaned up');
    }
}

module.exports = DraconiaIntegration;
