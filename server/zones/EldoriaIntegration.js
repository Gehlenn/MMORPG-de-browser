/**
 * EldoriaIntegration.js
 * Main integration system for Eldoria zone
 * Connects zone, environment, mobs, boss, and transitions
 */

const EldoriaZone = require('./EldoriaZone');
const EldoriaEnvironment = require('./EldoriaEnvironment');
const ZoneTransition = require('./ZoneTransition');

// Mobs
const ForestDeer = require('../mobs/eldoria/ForestDeer');
const WildBoar = require('../mobs/eldoria/WildBoar');
const Bandit = require('../mobs/eldoria/Bandit');
const Knight = require('../mobs/eldoria/Knight');
const RoyalGuard = require('../mobs/eldoria/RoyalGuard');
const CaveTroll = require('../mobs/eldoria/CaveTroll');
const IronGolem = require('../mobs/eldoria/IronGolem');

// Boss
const KingEldor = require('../bosses/KingEldor');

class EldoriaIntegration {
    constructor(database, server) {
        this.db = database;
        this.server = server;
        this.zone = null;
        this.environment = null;
        this.transition = null;
        this.boss = null;
        
        // Mob management
        this.mobs = new Map();
        this.spawnedMobs = new Map();
        this.mobClasses = {
            forest_deer: ForestDeer,
            wild_boar: WildBoar,
            bandit: Bandit,
            knight: Knight,
            royal_guard: RoyalGuard,
            cave_troll: CaveTroll,
            iron_golem: IronGolem
        };
        
        // Spawn configurations per sub-zone
        this.spawnConfigs = {};
        this.bossSpawned = false;
        this.bossCooldown = 3 * 24 * 60 * 60 * 1000; // 3 days
        this.lastBossKill = null;
    }
    
    async initialize() {
        // Initialize zone
        this.zone = new EldoriaZone(this.db, null, null);
        await this.zone.initialize();
        
        // Initialize environment
        this.environment = new EldoriaEnvironment(this.db, this.zone);
        await this.environment.initialize();
        
        // Initialize transition system (ZoneTransition initializes in constructor)
        this.transition = new ZoneTransition(this.db, new Map([['eldoria', this.zone]]), null);
        
        // Setup mob spawning
        this.setupSpawnConfigurations();
        this.spawnInitialMobs();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('[EldoriaIntegration] Initialized successfully');
    }
    
    setupSpawnConfigurations() {
        this.spawnConfigs = {
            forest_deer: {
                type: 'forest_deer',
                x: 300 + Math.random() * 400,
                y: 400 + Math.random() * 300,
                subZone: 'royal_forest',
                respawnTime: 60000,
                maxCount: 5
            },
            wild_boar: {
                type: 'wild_boar',
                x: 200 + Math.random() * 500,
                y: 300 + Math.random() * 400,
                subZone: 'royal_forest',
                respawnTime: 90000,
                maxCount: 4
            },
            bandit: {
                type: 'bandit',
                x: 400 + Math.random() * 300,
                y: 350 + Math.random() * 250,
                subZone: 'royal_forest',
                respawnTime: 120000,
                maxCount: 3
            },
            cave_troll: {
                type: 'cave_troll',
                x: 1200 + Math.random() * 200,
                y: 400 + Math.random() * 150,
                subZone: 'iron_mines',
                respawnTime: 180000,
                maxCount: 2
            },
            iron_golem: {
                type: 'iron_golem',
                x: 1300 + Math.random() * 150,
                y: 450 + Math.random() * 100,
                subZone: 'iron_mines',
                respawnTime: 300000,
                maxCount: 2
            },
            knight: {
                type: 'knight',
                x: 1600 + Math.random() * 200,
                y: 600 + Math.random() * 200,
                subZone: 'castle_grounds',
                respawnTime: 150000,
                maxCount: 3
            },
            royal_guard: {
                type: 'royal_guard',
                x: 1700 + Math.random() * 150,
                y: 700 + Math.random() * 150,
                subZone: 'castle_grounds',
                respawnTime: 240000,
                maxCount: 2
            }
        };
    }
    
    spawnInitialMobs() {
        // Spawn initial mobs for each type
        Object.values(this.spawnConfigs).forEach(config => {
            for (let i = 0; i < config.maxCount; i++) {
                this.spawnMob(config.type);
            }
        });
    }
    
    spawnMob(type) {
        const config = this.spawnConfigs[type];
        if (!config) return null;
        
        const MobClass = this.mobClasses[type];
        if (!MobClass) return null;
        
        // Eldoria mobs use (zone, spawnPosition) constructor
        const spawnPosition = {
            x: config.x + (Math.random() - 0.5) * 100,
            y: config.y + (Math.random() - 0.5) * 100
        };
        
        const mob = new MobClass(this.zone, spawnPosition);
        mob.subZone = config.subZone;
        
        this.spawnedMobs.set(mob.id, mob);
        
        // Note: Eldoria mobs don't extend EventEmitter, death is handled differently
        
        return mob;
    }
    
    handleMobDeath(mobId, type) {
        this.spawnedMobs.delete(mobId);
        
        // Schedule respawn
        const config = this.spawnConfigs[type];
        if (config) {
            setTimeout(() => {
                this.spawnMob(type);
            }, config.respawnTime);
        }
        
        // Broadcast to zone
        if (this.server) {
            this.server.broadcastToZone('eldoria', 'mob_died', {
                mobId,
                type,
                respawnTime: config?.respawnTime || 60000
            });
        }
    }
    
    setupEventListeners() {
        // Environment events
        this.environment.on('weatherChange', (data) => {
            if (this.server) {
                this.server.broadcastToZone('eldoria', 'weather_update', data);
            }
        });
        
        // Transition events
        this.transition.on('playerTransition', (data) => {
            if (this.server) {
                this.server.broadcastToZone('eldoria', 'player_entered', {
                    playerId: data.playerId,
                    fromZone: data.fromZone
                });
            }
        });
    }
    
    canPlayerAccessBoss(playerId, playerData) {
        // Check if player is at throne room area
        const dx = playerData.x - 1800;
        const dy = playerData.y - 1200;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 100) return false;
        
        // Check level requirement
        if (playerData.level < 38) return false;
        
        return true;
    }
    
    spawnBossIfReady() {
        if (this.bossSpawned) return false;
        
        // Check cooldown
        if (this.lastBossKill && Date.now() - this.lastBossKill < this.bossCooldown) {
            return false;
        }
        
        // Spawn King Eldor
        this.boss = new KingEldor('king_eldor_1', 'eldoria');
        this.boss.x = 1850;
        this.boss.y = 1250;
        this.bossSpawned = true;
        
        // Listen for boss death
        this.boss.on('death', () => {
            this.lastBossKill = Date.now();
            this.bossSpawned = false;
            this.boss = null;
        });
        
        // Broadcast spawn
        if (this.server) {
            this.server.broadcastToZone('eldoria', 'boss_spawned', {
                bossId: this.boss.id,
                name: this.boss.name,
                x: this.boss.x,
                y: this.boss.y
            });
        }
        
        return true;
    }
    
    async registerPlayer(playerId, playerData) {
        this.zone.playerEnter(playerId, playerData);
        return true;
    }
    
    async unregisterPlayer(playerId) {
        this.zone.playerLeave(playerId);
        return true;
    }
    
    handlePlayerEnter(playerId, playerData) {
        // Send zone data
        if (this.server) {
            this.server.sendToPlayer(playerId, 'zone_data', this.getZoneData());
        }
        
        // Register player
        this.registerPlayer(playerId, playerData);
    }
    
    getZoneData() {
        return {
            zone: this.zone.config,
            environment: this.environment.getClientData(),
            mobs: Array.from(this.spawnedMobs.values()).map(m => ({
                id: m.id,
                name: m.name,
                level: m.level,
                x: m.x,
                y: m.y,
                type: m.type
            })),
            boss: this.boss ? this.boss.getBossData() : null,
            bossAvailable: !this.bossSpawned && (!this.lastBossKill || Date.now() - this.lastBossKill >= this.bossCooldown)
        };
    }
    
    getStatistics() {
        return {
            zone: {
                id: this.zone.config.id,
                name: this.zone.config.name,
                playerCount: this.zone.activePlayers.size
            },
            environment: this.environment.getFullData(),
            mobs: {
                totalSpawned: this.spawnedMobs.size,
                byType: this.getMobCountsByType()
            },
            boss: {
                spawned: this.bossSpawned,
                nextSpawnAvailable: this.lastBossKill ? this.lastBossKill + this.bossCooldown : Date.now()
            }
        };
    }
    
    getMobCountsByType() {
        const counts = {};
        for (const mob of this.spawnedMobs.values()) {
            const type = mob.type || 'unknown';
            counts[type] = (counts[type] || 0) + 1;
        }
        return counts;
    }
    
    cleanup() {
        // Clean up mobs
        for (const mob of this.spawnedMobs.values()) {
            mob.cleanup();
        }
        this.spawnedMobs.clear();
        
        // Clean up boss
        if (this.boss) {
            this.boss.cleanup();
            this.boss = null;
        }
        
        // Clean up systems
        if (this.zone && this.zone.cleanup) this.zone.cleanup();
        if (this.environment && this.environment.cleanup) this.environment.cleanup();
        // ZoneTransition doesn't have cleanup method - skip
        
        if (this.removeAllListeners) this.removeAllListeners();
    }
}

module.exports = EldoriaIntegration;
