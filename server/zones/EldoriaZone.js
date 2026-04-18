/**
 * EldoriaZone.js
 * Eldoria - The Central Kingdom zone configuration and management
 * Phase 3: New Zones
 */

const EventEmitter = require('events');

class EldoriaZone extends EventEmitter {
    constructor(database, mobSpawner, lootManager) {
        super();
        this.db = database;
        this.mobSpawner = mobSpawner;
        this.lootManager = lootManager;
        
        // Zone configuration
        this.config = {
            id: 'eldoria',
            name: 'Eldoria - The Central Kingdom',
            description: 'A medieval kingdom with vast forests, iron mines, and a grand castle.',
            levelRange: { min: 20, max: 40 },
            size: { width: 2000, height: 1500 },
            
            // Safe zones (no PvP, no mob aggro)
            safeZones: [
                {
                    name: 'Eldoria City',
                    x: 1000,
                    y: 750,
                    radius: 200,
                    description: 'The capital city with shops, bank, and tavern'
                }
            ],
            
            // Spawn points
            spawnPoints: {
                newPlayers: { x: 1000, y: 750 },
                fromVerdantis: { x: 100, y: 750 },
                default: { x: 1000, y: 750 }
            },
            
            // Sub-zones with mob spawn configurations
            subZones: [
                {
                    name: 'Royal Forest',
                    x: 300,
                    y: 400,
                    radius: 350,
                    levelRange: { min: 20, max: 25 },
                    mobs: ['forest_deer', 'wild_boar', 'bandit'],
                    mobDensity: 0.4,
                    description: 'Peaceful forest home to wildlife and bandits'
                },
                {
                    name: 'Iron Mines',
                    x: 500,
                    y: 300,
                    radius: 200,
                    levelRange: { min: 25, max: 30 },
                    mobs: ['iron_golem'],
                    mobDensity: 0.3,
                    isDungeon: true,
                    description: 'Abandoned mines infested with iron golems'
                },
                {
                    name: 'Castle Grounds',
                    x: 1500,
                    y: 600,
                    radius: 250,
                    levelRange: { min: 30, max: 35 },
                    mobs: ['royal_guard', 'knight'],
                    mobDensity: 0.5,
                    description: 'The outer grounds of King Eldor\'s castle'
                }
            ],
            
            // Boss location
            boss: {
                id: 'king_eldor',
                name: 'King Eldor',
                x: 1600,
                y: 700,
                level: 40,
                isRaid: true,
                minPlayers: 3,
                maxPlayers: 5,
                respawnTime: 6 * 60 * 60 * 1000, // 6 hours in ms
                locationName: 'The Throne Room'
            },
            
            // Resources
            resources: ['iron_ore', 'royal_wood', 'silk'],
            
            // Portals to other zones
            portals: [
                {
                    id: 'eldoria_to_verdantis',
                    name: 'Western Pass',
                    x: 50,
                    y: 750,
                    targetZone: 'verdantis',
                    targetX: 1150,
                    targetY: 400,
                    requiredLevel: 1
                }
            ],
            
            // World map data
            mapData: {
                icon: 'castle',
                color: '#2E7D32',
                fogColor: '#1B5E20',
                discovered: false
            }
        };
        
        // Active entities in zone
        this.activeMobs = new Map();
        this.activePlayers = new Set();
        this.bossState = {
            isSpawned: false,
            lastKillTime: null,
            currentHP: null,
            phase: 1
        };
        
        // Mob spawn intervals
        this.spawnIntervals = new Map();
    }
    
    /**
     * Initialize the zone
     */
    async initialize() {
        console.log('[EldoriaZone] Initializing Eldoria...');
        
        // Load boss state from database
        await this.loadBossState();
        
        // Start mob spawning
        this.startMobSpawning();
        
        // Check if boss should be spawned
        this.checkBossSpawn();
        
        this.emit('initialized', { zone: this.config.id });
        console.log('[EldoriaZone] Eldoria initialized successfully');
    }
    
    /**
     * Load boss state from database
     */
    async loadBossState() {
        try {
            const result = await this.db.get(
                'SELECT * FROM boss_kills WHERE boss_id = ? ORDER BY kill_time DESC LIMIT 1',
                ['king_eldor']
            );
            
            if (result) {
                this.bossState.lastKillTime = new Date(result.kill_time).getTime();
                console.log(`[EldoriaZone] Last King Eldor kill: ${result.kill_time}`);
            }
        } catch (error) {
            console.error('[EldoriaZone] Error loading boss state:', error);
        }
    }
    
    /**
     * Start mob spawning in sub-zones
     */
    startMobSpawning() {
        for (const subZone of this.config.subZones) {
            const interval = setInterval(() => {
                this.spawnMobsInSubZone(subZone);
            }, 30000); // Check every 30 seconds
            
            this.spawnIntervals.set(subZone.name, interval);
        }
        
        // Initial spawn
        for (const subZone of this.config.subZones) {
            this.spawnMobsInSubZone(subZone);
        }
    }
    
    /**
     * Spawn mobs in a sub-zone
     */
    spawnMobsInSubZone(subZone) {
        // Calculate how many mobs should be in this zone
        const area = Math.PI * subZone.radius * subZone.radius;
        const targetMobCount = Math.floor(area / 10000 * subZone.mobDensity);
        
        // Count current mobs in this sub-zone
        const currentMobs = Array.from(this.activeMobs.values()).filter(
            mob => this.isInSubZone(mob.x, mob.y, subZone)
        ).length;
        
        // Spawn new mobs if needed
        const mobsToSpawn = targetMobCount - currentMobs;
        if (mobsToSpawn > 0) {
            for (let i = 0; i < mobsToSpawn; i++) {
                this.spawnMob(subZone);
            }
        }
    }
    
    /**
     * Spawn a single mob
     */
    spawnMob(subZone) {
        // Pick random mob type
        const mobType = subZone.mobs[Math.floor(Math.random() * subZone.mobs.length)];
        
        // Calculate random position within sub-zone
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * subZone.radius;
        const x = subZone.x + Math.cos(angle) * distance;
        const y = subZone.y + Math.sin(angle) * distance;
        
        // Create mob data
        const mob = {
            id: `eldoria_${mobType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: mobType,
            x: Math.floor(x),
            y: Math.floor(y),
            zone: this.config.id,
            subZone: subZone.name,
            spawnedAt: Date.now()
        };
        
        this.activeMobs.set(mob.id, mob);
        
        // Emit spawn event
        this.emit('mob:spawned', mob);
    }
    
    /**
     * Check if coordinates are within a sub-zone
     */
    isInSubZone(x, y, subZone) {
        const dx = x - subZone.x;
        const dy = y - subZone.y;
        return Math.sqrt(dx * dx + dy * dy) <= subZone.radius;
    }
    
    /**
     * Check if boss should be spawned
     */
    checkBossSpawn() {
        if (this.bossState.isSpawned) return;
        
        const now = Date.now();
        const respawnTime = this.config.boss.respawnTime;
        
        if (!this.bossState.lastKillTime || (now - this.bossState.lastKillTime) >= respawnTime) {
            this.spawnBoss();
        } else {
            const remaining = this.bossState.lastKillTime + respawnTime - now;
            console.log(`[EldoriaZone] King Eldor respawns in ${Math.ceil(remaining / 60000)} minutes`);
        }
    }
    
    /**
     * Spawn the boss
     */
    spawnBoss() {
        const boss = {
            id: 'king_eldor',
            type: 'boss',
            name: this.config.boss.name,
            x: this.config.boss.x,
            y: this.config.boss.y,
            level: this.config.boss.level,
            zone: this.config.id,
            isRaid: true,
            phase: 1,
            spawnedAt: Date.now()
        };
        
        this.bossState.isSpawned = true;
        this.bossState.currentHP = null; // Will be set by boss controller
        this.bossState.phase = 1;
        
        this.emit('boss:spawned', boss);
        console.log('[EldoriaZone] King Eldor has spawned in The Throne Room!');
    }
    
    /**
     * Record boss kill
     */
    async recordBossKill(playerId, participants, lootData) {
        try {
            await this.db.run(
                `INSERT INTO boss_kills (player_id, boss_id, boss_name, zone_id, raid_group, loot_distributed)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    playerId,
                    'king_eldor',
                    'King Eldor',
                    this.config.id,
                    JSON.stringify(participants),
                    lootData ? 1 : 0
                ]
            );
            
            this.bossState.lastKillTime = Date.now();
            this.bossState.isSpawned = false;
            
            // Schedule next spawn check
            setTimeout(() => this.checkBossSpawn(), this.config.boss.respawnTime);
            
            this.emit('boss:killed', {
                boss: 'king_eldor',
                killer: playerId,
                participants,
                nextSpawn: this.bossState.lastKillTime + this.config.boss.respawnTime
            });
            
        } catch (error) {
            console.error('[EldoriaZone] Error recording boss kill:', error);
        }
    }
    
    /**
     * Player enters the zone
     */
    playerEnter(playerId, position = null) {
        this.activePlayers.add(playerId);
        
        // Determine spawn position
        let spawnPos = position;
        if (!spawnPos) {
            spawnPos = this.config.spawnPoints.default;
        }
        
        this.emit('player:entered', {
            playerId,
            zone: this.config.id,
            position: spawnPos
        });
        
        return spawnPos;
    }
    
    /**
     * Player leaves the zone
     */
    playerLeave(playerId) {
        this.activePlayers.delete(playerId);
        
        this.emit('player:left', {
            playerId,
            zone: this.config.id
        });
    }
    
    /**
     * Check if position is in a safe zone
     */
    isInSafeZone(x, y) {
        for (const safeZone of this.config.safeZones) {
            const dx = x - safeZone.x;
            const dy = y - safeZone.y;
            if (Math.sqrt(dx * dx + dy * dy) <= safeZone.radius) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Get safe zone at position
     */
    getSafeZoneAt(x, y) {
        for (const safeZone of this.config.safeZones) {
            const dx = x - safeZone.x;
            const dy = y - safeZone.y;
            if (Math.sqrt(dx * dx + dy * dy) <= safeZone.radius) {
                return safeZone;
            }
        }
        return null;
    }
    
    /**
     * Get sub-zone at position
     */
    getSubZoneAt(x, y) {
        for (const subZone of this.config.subZones) {
            if (this.isInSubZone(x, y, subZone)) {
                return subZone;
            }
        }
        return null;
    }
    
    /**
     * Get mob at position (for combat)
     */
    getMobAt(x, y, radius = 50) {
        for (const [id, mob] of this.activeMobs) {
            const dx = mob.x - x;
            const dy = mob.y - y;
            if (Math.sqrt(dx * dx + dy * dy) <= radius) {
                return mob;
            }
        }
        return null;
    }
    
    /**
     * Get mob by ID
     */
    getMob(mobId) {
        return this.activeMobs.get(mobId);
    }
    
    /**
     * Remove a mob
     */
    removeMob(mobId) {
        const mob = this.activeMobs.get(mobId);
        if (mob) {
            this.activeMobs.delete(mobId);
            this.emit('mob:removed', mob);
            return true;
        }
        return false;
    }
    
    /**
     * Get zone info for client
     */
    getZoneInfo() {
        return {
            id: this.config.id,
            name: this.config.name,
            description: this.config.description,
            levelRange: this.config.levelRange,
            size: this.config.size,
            safeZones: this.config.safeZones,
            portals: this.config.portals,
            boss: {
                name: this.config.boss.name,
                level: this.config.boss.level,
                isSpawned: this.bossState.isSpawned,
                location: this.config.boss.locationName
            }
        };
    }
    
    /**
     * Get all active mobs
     */
    getActiveMobs() {
        return Array.from(this.activeMobs.values());
    }
    
    /**
     * Get active player count
     */
    getPlayerCount() {
        return this.activePlayers.size;
    }
    
    /**
     * Cleanup on shutdown
     */
    async cleanup() {
        // Clear spawn intervals
        for (const interval of this.spawnIntervals.values()) {
            clearInterval(interval);
        }
        this.spawnIntervals.clear();
        
        this.emit('cleanup');
    }
}

module.exports = EldoriaZone;
