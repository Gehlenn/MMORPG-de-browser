/**
 * AureliaZone.js
 * 
 * Aurélia - The Golden Desert
 * Zone configuration and management for the desert expansion
 * Level Range: 40-60
 */

const ZoneTransition = require('./ZoneTransition');

class AureliaZone {
    constructor(database) {
        this.db = database;
        this.id = 'aurelia';
        this.name = 'Aurélia - The Golden Desert';
        
        // Zone dimensions
        this.width = 2500;
        this.height = 2000;
        
        // Level requirements
        this.levelRange = { min: 40, max: 60 };
        this.requiredLevel = 40;
        
        // Safe zones
        this.safeZones = [
            {
                id: 'oasis_shamara',
                name: 'Oásis de Shamara',
                x: 500,
                y: 1500,
                radius: 150,
                description: 'Um oásis de paz no meio do deserto impiedoso'
            }
        ];
        
        // Spawn points
        this.spawnPoints = {
            newPlayers: { x: 500, y: 1500 },
            fromEldoria: { x: 100, y: 1000 },
            respawn: { x: 500, y: 1500 } // Oasis respawn
        };
        
        // Portals to other zones
        this.portals = [
            {
                id: 'to_eldoria',
                name: 'Desert Pass',
                x: 100,
                y: 1000,
                targetZone: 'eldoria',
                targetPosition: { x: 1000, y: 1400 },
                description: 'Volta para Eldoria'
            }
        ];
        
        // Sub-zones with specific properties
        this.subZones = [
            {
                id: 'oasis',
                name: 'Oásis de Shamara',
                type: 'safe',
                bounds: { x: 350, y: 1350, width: 300, height: 300 },
                levelRange: { min: 40, max: 40 },
                description: 'Área segura no deserto'
            },
            {
                id: 'golden_dunes',
                name: 'Dunas Douradas',
                type: 'combat',
                bounds: { x: 0, y: 0, width: 1000, height: 1000 },
                levelRange: { min: 40, max: 45 },
                description: 'Território dos escaravelhos e vermes',
                mobs: ['giant_scorpion', 'sand_worm'],
                mobDensity: 0.6,
                environmentalEffect: 'heat'
            },
            {
                id: 'ruins_ankhet',
                name: 'Ruínas de Ankhet',
                type: 'combat',
                bounds: { x: 1000, y: 0, width: 800, height: 1200 },
                levelRange: { min: 45, max: 50 },
                description: 'Ruínas antigas habitadas por múmias',
                mobs: ['mummy', 'ancient_construct'],
                mobDensity: 0.5,
                environmentalEffect: 'heat'
            },
            {
                id: 'thief_valley',
                name: 'Vale dos Ladrões',
                type: 'combat',
                bounds: { x: 800, y: 1200, width: 1000, height: 800 },
                levelRange: { min: 50, max: 55 },
                description: 'Território dos bandidos do deserto',
                mobs: ['desert_bandit', 'mercenary_captain'],
                mobDensity: 0.4,
                environmentalEffect: 'heat'
            },
            {
                id: 'pyramid_anub',
                name: 'Pirâmide de Anub',
                type: 'raid',
                bounds: { x: 1800, y: 400, width: 700, height: 600 },
                levelRange: { min: 60, max: 60 },
                description: 'Tumba do Faraó Anub - Raid de nível 60',
                boss: 'pharaoh_anub',
                maxPlayers: 8,
                requiredKey: 'key_of_the_sun',
                environmentalEffect: 'none' // Climate controlled inside
            }
        ];
        
        // Resources that can be gathered
        this.resources = [
            { id: 'desert_herbs', name: 'Ervas do Deserto', rarity: 'common' },
            { id: 'gold_nuggets', name: 'Pepitas de Ouro', rarity: 'uncommon' },
            { id: 'ancient_relics', name: 'Relíquias Antigas', rarity: 'rare' },
            { id: 'sand_crystal', name: 'Cristal de Areia', rarity: 'uncommon' }
        ];
        
        // Environmental effects configuration
        this.environmentalConfig = {
            day: {
                startHour: 6,
                endHour: 18,
                heatDamage: 2,
                damageInterval: 10000, // 10 seconds
                speedPenalty: 0.1, // 10% slower
                staminaRegenPenalty: 0.2, // 20% slower stamina regen
                description: 'O sol escaldante queima sua pele'
            },
            night: {
                startHour: 18,
                endHour: 6,
                coldDamage: 1,
                damageInterval: 15000, // 15 seconds
                visionReduction: 0.3, // 30% reduced vision
                description: 'O frio do deserto penetra seus ossos'
            }
        };
        
        // Sandstorm configuration
        this.sandstormConfig = {
            minInterval: 30 * 60 * 1000, // 30 minutes
            maxInterval: 60 * 60 * 1000, // 60 minutes
            minDuration: 5 * 60 * 1000, // 5 minutes
            maxDuration: 10 * 60 * 1000, // 10 minutes
            visibilityReduction: 0.5, // 50% reduced
            speedReduction: 0.3, // 30% slower
            pushForce: 2, // Slight push in random direction
            warningTime: 60000 // 1 minute warning
        };
        
        // Zone state
        this.zoneTransition = null;
        this.environmentalSystem = null;
        this.discoveredZones = new Set(['oasis']); // Oasis is always discovered
        
        // Initialize
        this.initialize();
    }
    
    /**
     * Initialize zone systems
     */
    async initialize() {
        console.log('[AureliaZone] Initializing Aurélia - The Golden Desert...');
        
        // Initialize zone transition system
        this.zoneTransition = new ZoneTransition(this.db, this);
        await this.zoneTransition.initialize();
        
        // Load discovered zones from database
        await this.loadDiscoveredZones();
        
        console.log(`[AureliaZone] Aurelia initialized. Size: ${this.width}x${this.height}`);
    }
    
    /**
     * Get zone info for a player
     */
    async getZoneInfo(playerId) {
        try {
            const progress = await this.db.get(
                'SELECT * FROM aurelia_zone_data WHERE player_id = ?',
                [playerId]
            );
            
            if (!progress) {
                // Create default entry
                await this.db.run(
                    'INSERT INTO aurelia_zone_data (player_id) VALUES (?)',
                    [playerId]
                );
                
                return {
                    heatResistance: 0,
                    coldResistance: 0,
                    discoveredLocations: ['oasis'],
                    sandstormsSurvived: 0,
                    anubAttempts: 0,
                    anubKills: 0
                };
            }
            
            return {
                heatResistance: progress.heat_resistance,
                coldResistance: progress.cold_resistance,
                discoveredLocations: JSON.parse(progress.discovered_locations || '[]'),
                sandstormsSurvived: progress.sandstorms_survived,
                anubAttempts: progress.anub_attempts,
                anubKills: progress.anub_kills
            };
        } catch (error) {
            console.error('[AureliaZone] Error getting zone info:', error);
            return null;
        }
    }
    
    /**
     * Load discovered zones from database
     */
    async loadDiscoveredZones() {
        try {
            const allLocations = await this.db.all(
                'SELECT DISTINCT player_id, discovered_locations FROM aurelia_zone_data'
            );
            
            // Aggregate all discovered locations
            allLocations.forEach(row => {
                const locations = JSON.parse(row.discovered_locations || '[]');
                locations.forEach(loc => this.discoveredZones.add(loc));
            });
        } catch (error) {
            console.error('[AureliaZone] Error loading discovered zones:', error);
        }
    }
    
    /**
     * Discover a new location for a player
     */
    async discoverLocation(playerId, locationId) {
        try {
            const info = await this.getZoneInfo(playerId);
            
            if (!info.discoveredLocations.includes(locationId)) {
                info.discoveredLocations.push(locationId);
                
                await this.db.run(
                    'UPDATE aurelia_zone_data SET discovered_locations = ? WHERE player_id = ?',
                    [JSON.stringify(info.discoveredLocations), playerId]
                );
                
                this.discoveredZones.add(locationId);
                
                return {
                    success: true,
                    message: `Nova área descoberta: ${this.getSubZoneName(locationId)}`,
                    location: locationId
                };
            }
            
            return { success: false, message: 'Área já descoberta' };
        } catch (error) {
            console.error('[AureliaZone] Error discovering location:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Get sub-zone name by ID
     */
    getSubZoneName(subZoneId) {
        const subZone = this.subZones.find(z => z.id === subZoneId);
        return subZone ? subZone.name : subZoneId;
    }
    
    /**
     * Check if player can enter this zone
     */
    canEnter(playerLevel, fromZone) {
        if (playerLevel < this.requiredLevel) {
            return {
                allowed: false,
                reason: `Nível ${this.requiredLevel}+ necessário para entrar em Aurélia`,
                requiredLevel: this.requiredLevel,
                playerLevel
            };
        }
        
        // Check if coming from allowed zone
        const allowedFromZones = ['eldoria', 'admin'];
        if (!allowedFromZones.includes(fromZone)) {
            return {
                allowed: false,
                reason: `Acesso permitido apenas de: ${allowedFromZones.join(', ')}`,
                fromZone
            };
        }
        
        return { allowed: true };
    }
    
    /**
     * Get spawn point for player
     */
    getSpawnPoint(entryType = 'new') {
        switch (entryType) {
            case 'new':
                return this.spawnPoints.newPlayers;
            case 'from_eldoria':
                return this.spawnPoints.fromEldoria;
            case 'respawn':
            case 'death':
                return this.spawnPoints.respawn;
            default:
                return this.spawnPoints.newPlayers;
        }
    }
    
    /**
     * Get sub-zone at position
     */
    getSubZoneAt(x, y) {
        for (const zone of this.subZones) {
            const bounds = zone.bounds;
            if (x >= bounds.x && x <= bounds.x + bounds.width &&
                y >= bounds.y && y <= bounds.y + bounds.height) {
                return zone;
            }
        }
        return null; // Default to dunes if no match
    }
    
    /**
     * Check if position is in a safe zone
     */
    isInSafeZone(x, y) {
        for (const zone of this.safeZones) {
            const dx = x - zone.x;
            const dy = y - zone.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= zone.radius) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Get safe zone at position
     */
    getSafeZoneAt(x, y) {
        for (const zone of this.safeZones) {
            const dx = x - zone.x;
            const dy = y - zone.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= zone.radius) {
                return zone;
            }
        }
        return null;
    }
    
    /**
     * Get portal at position (with tolerance)
     */
    getPortalAt(x, y, tolerance = 50) {
        for (const portal of this.portals) {
            const dx = x - portal.x;
            const dy = y - portal.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= tolerance) {
                return portal;
            }
        }
        return null;
    }
    
    /**
     * Get random position within a sub-zone
     */
    getRandomPositionInSubZone(subZoneId) {
        const zone = this.subZones.find(z => z.id === subZoneId);
        if (!zone) return null;
        
        const bounds = zone.bounds;
        return {
            x: bounds.x + Math.random() * bounds.width,
            y: bounds.y + Math.random() * bounds.height,
            zone: subZoneId
        };
    }
    
    /**
     * Get random valid position in the zone
     */
    getRandomPosition() {
        return {
            x: Math.random() * this.width,
            y: Math.random() * this.height
        };
    }
    
    /**
     * Get zone boundaries
     */
    getBounds() {
        return {
            x: 0,
            y: 0,
            width: this.width,
            height: this.height
        };
    }
    
    /**
     * Check if position is within zone bounds
     */
    isInBounds(x, y) {
        return x >= 0 && x <= this.width && y >= 0 && y <= this.height;
    }
    
    /**
     * Get environmental effects for current time
     */
    getEnvironmentalEffects(hour) {
        const dayConfig = this.environmentalConfig.day;
        const nightConfig = this.environmentalConfig.night;
        
        // Check if it's day (6 AM to 6 PM)
        const isDay = hour >= dayConfig.startHour && hour < dayConfig.endHour;
        
        if (isDay) {
            return {
                type: 'heat',
                damage: dayConfig.heatDamage,
                interval: dayConfig.damageInterval,
                speedPenalty: dayConfig.speedPenalty,
                staminaRegenPenalty: dayConfig.staminaRegenPenalty,
                description: dayConfig.description
            };
        } else {
            return {
                type: 'cold',
                damage: nightConfig.coldDamage,
                interval: nightConfig.damageInterval,
                visionReduction: nightConfig.visionReduction,
                description: nightConfig.description
            };
        }
    }
    
    /**
     * Get zone configuration for client
     */
    getClientConfig() {
        return {
            id: this.id,
            name: this.name,
            width: this.width,
            height: this.height,
            levelRange: this.levelRange,
            safeZones: this.safeZones,
            spawnPoints: this.spawnPoints,
            portals: this.portals,
            subZones: this.subZones.map(z => ({
                id: z.id,
                name: z.name,
                type: z.type,
                bounds: z.bounds,
                levelRange: z.levelRange,
                description: z.description
            })),
            resources: this.resources,
            environmentalConfig: this.environmentalConfig
        };
    }
    
    /**
     * Get full zone data for new player
     */
    async getFullZoneData(playerId, playerLevel) {
        const zoneInfo = await this.getZoneInfo(playerId);
        
        return {
            zone: this.getClientConfig(),
            playerZoneInfo: zoneInfo,
            canEnter: this.canEnter(playerLevel, 'eldoria'),
            spawnPoint: this.getSpawnPoint('new'),
            environmentalEffects: this.getEnvironmentalEffects(new Date().getHours()),
            discoveredLocations: Array.from(this.discoveredZones)
        };
    }
    
    /**
     * Get nearby portals for a position
     */
    getNearbyPortals(x, y, range = 100) {
        return this.portals.filter(portal => {
            const dx = x - portal.x;
            const dy = y - portal.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= range;
        });
    }
    
    /**
     * Record zone entry
     */
    async recordEntry(playerId, fromZone, position, entryType = 'portal') {
        try {
            await this.db.run(
                `INSERT INTO aurelia_transitions 
                 (player_id, from_zone, to_zone, entry_type, position_x, position_y)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [playerId, fromZone, this.id, entryType, position.x, position.y]
            );
        } catch (error) {
            console.error('[AureliaZone] Error recording entry:', error);
        }
    }
    
    /**
     * Update player statistics
     */
    async updatePlayerStats(playerId, stats) {
        try {
            const setClause = Object.keys(stats)
                .map(key => `${key} = ${key} + ?`)
                .join(', ');
            
            const values = Object.values(stats);
            values.push(playerId);
            
            await this.db.run(
                `UPDATE aurelia_zone_data SET ${setClause} WHERE player_id = ?`,
                values
            );
        } catch (error) {
            console.error('[AureliaZone] Error updating stats:', error);
        }
    }
    
    /**
     * Get zone statistics
     */
    async getZoneStats() {
        try {
            const stats = await this.db.get(
                `SELECT 
                    COUNT(DISTINCT player_id) as total_visitors,
                    SUM(sandstorms_survived) as total_sandstorms,
                    SUM(anub_attempts) as total_anub_attempts,
                    SUM(anub_kills) as total_anub_kills
                 FROM aurelia_zone_data`
            );
            
            return {
                totalVisitors: stats.total_visitors || 0,
                totalSandstormsSurvived: stats.total_sandstorms || 0,
                totalAnubAttempts: stats.total_anub_attempts || 0,
                totalAnubKills: stats.total_anub_kills || 0,
                discoveredLocationsCount: this.discoveredZones.size
            };
        } catch (error) {
            console.error('[AureliaZone] Error getting zone stats:', error);
            return null;
        }
    }
    
    /**
     * Cleanup resources
     */
    async cleanup() {
        if (this.zoneTransition) {
            await this.zoneTransition.cleanup();
        }
        console.log('[AureliaZone] Cleanup complete');
    }
}

module.exports = AureliaZone;
