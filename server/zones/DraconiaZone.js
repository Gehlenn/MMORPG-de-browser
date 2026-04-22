/**
 * DraconiaZone.js
 * 
 * Draconia - The Dragon Peaks zone configuration and management
 * Phase 5: New Zones (Levels 60-80)
 */

const EventEmitter = require('events');

class DraconiaZone extends EventEmitter {
    constructor(database, mobSpawner, lootManager) {
        super();
        this.db = database;
        this.mobSpawner = mobSpawner;
        this.lootManager = lootManager;
        
        // Zone configuration
        this.config = {
            id: 'draconia',
            name: 'Dracônia - The Dragon Peaks',
            description: 'Ancient mountains where dragons dwell. Extreme conditions, high altitude, and deadly creatures await.',
            levelRange: { min: 60, max: 80 },
            size: { width: 5000, height: 5000 },
            
            // Safe zone (Dragon's Gate)
            safeZones: [
                {
                    name: "Dragon's Gate",
                    x: 500,
                    y: 500,
                    radius: 400,
                    description: 'Fortified passage serving as the entrance to Draconia'
                }
            ],
            
            // Spawn points
            spawnPoints: {
                newPlayers: { x: 500, y: 500 },
                fromAurelia: { x: 100, y: 2500 },
                default: { x: 500, y: 500 }
            },
            
            // Portals
            portals: [
                {
                    id: 'draconia_to_aurelia',
                    name: 'Passage to Aurelia',
                    x: 100,
                    y: 2500,
                    toZone: 'aurelia',
                    requiredLevel: 60
                },
                {
                    id: 'peak_portal',
                    name: 'Path to the Peak',
                    x: 2500,
                    y: 4000,
                    toZone: 'peak_of_ancients',
                    requiredLevel: 78,
                    requiresItem: 'dragon_blessing'
                }
            ]
        };
        
        // Sub-zones
        this.subZones = {
            dragons_gate: {
                id: 'dragons_gate',
                name: "Dragon's Gate",
                levelRange: { min: 60, max: 65 },
                x: 500,
                y: 500,
                radius: 800,
                isSafe: true,
                description: 'The fortified entrance to Draconia'
            },
            frostfire_ridge: {
                id: 'frostfire_ridge',
                name: 'Frostfire Ridge',
                levelRange: { min: 65, max: 70 },
                x: 1500,
                y: 1000,
                width: 1200,
                height: 1000,
                description: 'Ridge where volcanoes and glaciers coexist',
                hazards: ['thermal_vents', 'ice_fissures', 'avalanches']
            },
            wyvern_heights: {
                id: 'wyvern_heights',
                name: 'Wyvern Heights',
                levelRange: { min: 70, max: 75 },
                x: 3000,
                y: 1500,
                width: 1000,
                height: 1200,
                description: 'Mountain peaks dominated by flying creatures',
                hazards: ['high_winds', 'narrow_paths']
            },
            volcanic_core: {
                id: 'volcanic_core',
                name: 'Volcanic Core',
                levelRange: { min: 75, max: 78 },
                x: 4000,
                y: 2000,
                width: 800,
                height: 800,
                description: 'The volcanic heart of Draconia',
                hazards: ['lava_rivers', 'ash_storms', 'earthquakes', 'toxic_fumes']
            },
            peak_of_ancients: {
                id: 'peak_of_ancients',
                name: 'Peak of the Ancients',
                levelRange: { min: 78, max: 80 },
                x: 2500,
                y: 4000,
                width: 1000,
                height: 1000,
                isRaidZone: true,
                description: 'The highest peak where Ancient Dragons reside',
                requiresRaid: true,
                minRaidSize: 8,
                maxRaidSize: 20
            }
        };
        
        // Spawn points for mobs
        this.spawnPoints = new Map();
        this.setupSpawnPoints();
        
        // Resources
        this.resources = this.setupResources();
        
        // Player tracking
        this.players = new Map();
        
        // State
        this.initialized = false;
        this.active = false;
    }
    
    async initialize() {
        console.log('[DraconiaZone] Initializing Draconia zone...');
        
        // Load zone data from database
        await this.loadZoneData();
        
        this.initialized = true;
        this.active = true;
        
        console.log(`[DraconiaZone] Zone initialized: ${this.config.name}`);
        console.log(`[DraconiaZone] Sub-zones: ${Object.keys(this.subZones).length}`);
        console.log(`[DraconiaZone] Spawn points: ${this.spawnPoints.size}`);
        
        this.emit('initialized');
        return true;
    }
    
    setupSpawnPoints() {
        // Tier 1: Elemental Creatures (Frostfire Ridge)
        // Magma Crabs
        for (let i = 0; i < 8; i++) {
            this.spawnPoints.set(`magma_crab_${i}`, {
                id: `magma_crab_${i}`,
                type: 'magma_crab',
                x: 1200 + Math.random() * 800,
                y: 800 + Math.random() * 600,
                subZone: 'frostfire_ridge',
                respawnTime: 90000,
                lastSpawn: 0,
                currentMob: null
            });
        }
        
        // Frost Wolves
        for (let i = 0; i < 10; i++) {
            this.spawnPoints.set(`frost_wolf_${i}`, {
                id: `frost_wolf_${i}`,
                type: 'frost_wolf',
                x: 1400 + Math.random() * 800,
                y: 900 + Math.random() * 500,
                subZone: 'frostfire_ridge',
                respawnTime: 75000,
                lastSpawn: 0,
                currentMob: null,
                packId: Math.floor(i / 3) // Wolves in packs of 3
            });
        }
        
        // Steam Elementals
        for (let i = 0; i < 6; i++) {
            this.spawnPoints.set(`steam_elemental_${i}`, {
                id: `steam_elemental_${i}`,
                type: 'steam_elemental',
                x: 1300 + Math.random() * 600,
                y: 1000 + Math.random() * 400,
                subZone: 'frostfire_ridge',
                respawnTime: 105000,
                lastSpawn: 0,
                currentMob: null
            });
        }
        
        // Tier 2: Flying Predators (Wyvern Heights)
        // Wyverns
        for (let i = 0; i < 8; i++) {
            this.spawnPoints.set(`wyvern_${i}`, {
                id: `wyvern_${i}`,
                type: 'wyvern',
                x: 2800 + Math.random() * 800,
                y: 1200 + Math.random() * 800,
                subZone: 'wyvern_heights',
                respawnTime: 120000,
                lastSpawn: 0,
                currentMob: null,
                altitude: 100 + Math.random() * 200 // Flying height
            });
        }
        
        // Harpies
        for (let i = 0; i < 12; i++) {
            this.spawnPoints.set(`harpy_${i}`, {
                id: `harpy_${i}`,
                type: 'harpy',
                x: 2900 + Math.random() * 700,
                y: 1400 + Math.random() * 600,
                subZone: 'wyvern_heights',
                respawnTime: 60000,
                lastSpawn: 0,
                currentMob: null,
                flockId: Math.floor(i / 4)
            });
        }
        
        // Mountain Griffins (rare, 4 total)
        for (let i = 0; i < 4; i++) {
            this.spawnPoints.set(`griffin_${i}`, {
                id: `griffin_${i}`,
                type: 'mountain_griffin',
                x: 3000 + Math.random() * 500,
                y: 1300 + Math.random() * 500,
                subZone: 'wyvern_heights',
                respawnTime: 180000,
                lastSpawn: 0,
                currentMob: null,
                isRare: true
            });
        }
        
        // Tier 3: Fire Creatures (Volcanic Core)
        // Magma Golems
        for (let i = 0; i < 5; i++) {
            this.spawnPoints.set(`magma_golem_${i}`, {
                id: `magma_golem_${i}`,
                type: 'magma_golem',
                x: 3800 + Math.random() * 600,
                y: 1800 + Math.random() * 500,
                subZone: 'volcanic_core',
                respawnTime: 150000,
                lastSpawn: 0,
                currentMob: null,
                guardsTreasure: `volcanic_treasure_${i}`
            });
        }
        
        // Fire Drakes
        for (let i = 0; i < 6; i++) {
            this.spawnPoints.set(`fire_drake_${i}`, {
                id: `fire_drake_${i}`,
                type: 'fire_drake',
                x: 3900 + Math.random() * 500,
                y: 1900 + Math.random() * 400,
                subZone: 'volcanic_core',
                respawnTime: 135000,
                lastSpawn: 0,
                currentMob: null
            });
        }
        
        // Lava Serpents
        for (let i = 0; i < 8; i++) {
            this.spawnPoints.set(`lava_serpent_${i}`, {
                id: `lava_serpent_${i}`,
                type: 'lava_serpent',
                x: 3850 + Math.random() * 550,
                y: 1850 + Math.random() * 450,
                subZone: 'volcanic_core',
                respawnTime: 90000,
                lastSpawn: 0,
                currentMob: null,
                swimsInLava: true
            });
        }
    }
    
    setupResources() {
        return [
            // Dragon's Gate - Safe zone resources
            {
                id: 'dragons_breath_herb_0',
                type: 'dragons_breath_herb',
                name: "Dragon's Breath Herb",
                x: 600,
                y: 600,
                subZone: 'dragons_gate',
                respawnTime: 300000,
                quantity: 1,
                rarity: 'uncommon',
                lastGathered: 0
            },
            {
                id: 'ironwood_tree_0',
                type: 'ironwood',
                name: 'Ironwood Tree',
                x: 700,
                y: 550,
                subZone: 'dragons_gate',
                respawnTime: 600000,
                quantity: 3,
                rarity: 'rare',
                lastGathered: 0
            },
            {
                id: 'hot_spring_0',
                type: 'hot_spring',
                name: 'Hot Spring',
                x: 450,
                y: 650,
                subZone: 'dragons_gate',
                respawnTime: 180000,
                quantity: 5,
                rarity: 'common',
                lastGathered: 0
            },
            
            // Frostfire Ridge
            {
                id: 'geyser_vent_0',
                type: 'geyser_vent',
                name: 'Geyser Vent',
                x: 1400,
                y: 950,
                subZone: 'frostfire_ridge',
                respawnTime: 120000,
                quantity: 2,
                rarity: 'uncommon',
                lastGathered: 0
            },
            {
                id: 'frost_crystal_0',
                type: 'frost_crystal',
                name: 'Frost Crystal',
                x: 1600,
                y: 1100,
                subZone: 'frostfire_ridge',
                respawnTime: 300000,
                quantity: 1,
                rarity: 'rare',
                lastGathered: 0
            },
            
            // Wyvern Heights
            {
                id: 'storm_cloud_0',
                type: 'storm_essence',
                name: 'Storm Essence',
                x: 3200,
                y: 1600,
                subZone: 'wyvern_heights',
                respawnTime: 240000,
                quantity: 1,
                rarity: 'epic',
                lastGathered: 0
            },
            {
                id: 'griffin_nest_0',
                type: 'griffin_egg',
                name: 'Griffin Nest',
                x: 3300,
                y: 1700,
                subZone: 'wyvern_heights',
                respawnTime: 900000,
                quantity: 1,
                rarity: 'legendary',
                lastGathered: 0
            },
            
            // Volcanic Core
            {
                id: 'lava_pool_0',
                type: 'magma_essence',
                name: 'Lava Pool',
                x: 4100,
                y: 2100,
                subZone: 'volcanic_core',
                respawnTime: 300000,
                quantity: 2,
                rarity: 'epic',
                lastGathered: 0
            },
            {
                id: 'obsidian_deposit_0',
                type: 'obsidian',
                name: 'Obsidian Deposit',
                x: 4200,
                y: 2200,
                subZone: 'volcanic_core',
                respawnTime: 600000,
                quantity: 5,
                rarity: 'rare',
                lastGathered: 0
            }
        ];
    }
    
    async loadZoneData() {
        try {
            // Load zone configuration from database
            const config = await this.db.get(
                'SELECT * FROM zone_configurations WHERE zone_id = ?',
                ['draconia']
            );
            
            if (config) {
                console.log('[DraconiaZone] Loaded zone configuration from database');
            }
        } catch (error) {
            console.error('[DraconiaZone] Error loading zone data:', error);
        }
    }
    
    // Player management
    registerPlayer(playerId, playerData) {
        this.players.set(playerId, {
            ...playerData,
            enteredAt: Date.now(),
            altitudeSickness: 0,
            currentSubZone: null
        });
        
        // Determine initial sub-zone
        const subZone = this.getSubZoneAt(playerData.x, playerData.y);
        if (subZone) {
            const player = this.players.get(playerId);
            player.currentSubZone = subZone.id;
            this.emit('playerEnterSubZone', { playerId, subZone });
        }
        
        console.log(`[DraconiaZone] Player ${playerId} registered`);
        this.emit('playerJoined', { playerId, playerData });
    }
    
    unregisterPlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            // Save player data to database
            this.savePlayerData(playerId, player);
            this.players.delete(playerId);
            console.log(`[DraconiaZone] Player ${playerId} unregistered`);
            this.emit('playerLeft', { playerId });
        }
    }
    
    async savePlayerData(playerId, playerData) {
        try {
            const timeInZone = Date.now() - (playerData.enteredAt || Date.now());
            
            await this.db.run(`
                INSERT OR REPLACE INTO draconia_zone_data (
                    player_id, altitude_sickness_level, total_time_in_draconia,
                    last_position_x, last_position_y, sub_zone
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
                playerId,
                playerData.altitudeSickness || 0,
                timeInZone,
                playerData.x,
                playerData.y,
                playerData.currentSubZone
            ]);
        } catch (error) {
            console.error('[DraconiaZone] Error saving player data:', error);
        }
    }
    
    isPlayerInZone(playerId) {
        return this.players.has(playerId);
    }
    
    getPlayerCount() {
        return this.players.size;
    }
    
    // Position validation
    isValidPosition(x, y) {
        return x >= 0 && x <= this.config.size.width &&
               y >= 0 && y <= this.config.size.height;
    }
    
    isInSafeZone(x, y) {
        return this.config.safeZones.some(zone => {
            const dx = x - zone.x;
            const dy = y - zone.y;
            return Math.sqrt(dx * dx + dy * dy) <= zone.radius;
        });
    }
    
    getSubZoneAt(x, y) {
        for (const [id, zone] of Object.entries(this.subZones)) {
            if (zone.radius) {
                // Circular zone
                const dx = x - zone.x;
                const dy = y - zone.y;
                if (Math.sqrt(dx * dx + dy * dy) <= zone.radius) {
                    return zone;
                }
            } else {
                // Rectangular zone
                if (x >= zone.x && x <= zone.x + zone.width &&
                    y >= zone.y && y <= zone.y + zone.height) {
                    return zone;
                }
            }
        }
        return null;
    }
    
    // Level requirements
    checkLevelRequirement(level) {
        return level >= this.config.levelRange.min && 
               level <= this.config.levelRange.max;
    }
    
    getLevelRange() {
        return this.config.levelRange;
    }
    
    // Resources
    getResourcesInRange(x, y, radius) {
        return this.resources.filter(resource => {
            const dx = resource.x - x;
            const dy = resource.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= radius && resource.lastGathered < Date.now();
        });
    }
    
    async gatherResource(playerId, resourceId) {
        const resource = this.resources.find(r => r.id === resourceId);
        if (!resource) return { success: false, reason: 'Resource not found' };
        
        const now = Date.now();
        if (resource.lastGathered + resource.respawnTime > now) {
            return { success: false, reason: 'Resource not ready' };
        }
        
        // Mark as gathered
        resource.lastGathered = now;
        
        // Log to database
        try {
            const player = this.players.get(playerId);
            await this.db.run(`
                INSERT INTO draconia_resources_gathered 
                (player_id, resource_type, amount, sub_zone, position_x, position_y)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [playerId, resource.type, resource.quantity, resource.subZone, resource.x, resource.y]);
        } catch (error) {
            console.error('[DraconiaZone] Error logging resource:', error);
        }
        
        return {
            success: true,
            resource: {
                type: resource.type,
                name: resource.name,
                quantity: resource.quantity,
                rarity: resource.rarity
            }
        };
    }
    
    // Portals
    getPortalsForZone(zoneId) {
        return this.config.portals.filter(p => p.fromZone === zoneId || p.toZone === zoneId);
    }
    
    getPortal(portalId) {
        return this.config.portals.find(p => p.id === portalId);
    }
    
    // Data export
    getClientZoneData() {
        return {
            zoneId: this.config.id,
            name: this.config.name,
            description: this.config.description,
            dimensions: this.config.size,
            levelRange: this.config.levelRange,
            subZones: Object.values(this.subZones).map(sz => ({
                id: sz.id,
                name: sz.name,
                levelRange: sz.levelRange,
                x: sz.x,
                y: sz.y,
                isSafe: sz.isSafe || false,
                isRaidZone: sz.isRaidZone || false
            })),
            resources: this.resources.map(r => ({
                id: r.id,
                type: r.type,
                name: r.name,
                x: r.x,
                y: r.y,
                rarity: r.rarity
            })),
            portals: this.config.portals,
            safeZones: this.config.safeZones
        };
    }
    
    getFullData() {
        return {
            ...this.getClientZoneData(),
            playerCount: this.players.size,
            players: Array.from(this.players.keys()),
            activeMobs: this.spawnPoints.size,
            spawnPoints: Array.from(this.spawnPoints.keys()),
            environment: {
                altitude: 'high',
                temperature: 'extreme',
                weather: 'variable'
            }
        };
    }
    
    // Statistics
    getStatistics() {
        return {
            initialized: this.initialized,
            active: this.active,
            playerCount: this.players.size,
            spawnPoints: this.spawnPoints.size,
            subZones: Object.keys(this.subZones).length,
            resources: this.resources.length
        };
    }
    
    // Cleanup
    cleanup() {
        this.active = false;
        this.players.clear();
        this.removeAllListeners();
        console.log('[DraconiaZone] Zone cleaned up');
    }
}

module.exports = DraconiaZone;
