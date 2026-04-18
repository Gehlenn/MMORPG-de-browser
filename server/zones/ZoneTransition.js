/**
 * ZoneTransition.js
 * Portal and zone transition system
 * Phase 3: New Zones - Eldoria
 */

const EventEmitter = require('events');

class ZoneTransition extends EventEmitter {
    constructor(database, zones, playerManager) {
        super();
        this.db = database;
        this.zones = zones; // Map of zoneId -> zone instance
        this.playerManager = playerManager;
        
        // Portal configurations
        this.portals = new Map();
        
        // Players in transition
        this.transitioningPlayers = new Set();
        
        // Safe zone cooldown (10 seconds after combat)
        this.combatCooldown = 10000;
        this.playerCombatStatus = new Map(); // playerId -> lastCombatTime
        
        // Initialize portals
        this.initializePortals();
    }
    
    /**
     * Initialize portal definitions
     */
    initializePortals() {
        // Verdantis to Eldoria portal
        this.portals.set('verdantis_to_eldoria', {
            id: 'verdantis_to_eldoria',
            name: 'Eastern Gate',
            fromZone: 'verdantis',
            toZone: 'eldoria',
            fromPosition: { x: 1200, y: 400 },
            toPosition: { x: 100, y: 750 },
            requiredLevel: 20,
            description: 'The gate to Eldoria - Kingdom of the Central Plains'
        });
        
        // Eldoria to Verdantis portal
        this.portals.set('eldoria_to_verdantis', {
            id: 'eldoria_to_verdantis',
            name: 'Western Pass',
            fromZone: 'eldoria',
            toZone: 'verdantis',
            fromPosition: { x: 50, y: 750 },
            toPosition: { x: 1150, y: 400 },
            requiredLevel: 1, // Can always return
            description: 'Back to Verdantis'
        });
    }
    
    /**
     * Check if player can use portal
     */
    async canUsePortal(playerId, portalId) {
        const portal = this.portals.get(portalId);
        if (!portal) {
            return { allowed: false, reason: 'Portal not found' };
        }
        
        // Get player data
        const player = await this.playerManager.getPlayer(playerId);
        if (!player) {
            return { allowed: false, reason: 'Player not found' };
        }
        
        // Check level requirement
        const playerLevel = player.level || 1;
        if (playerLevel < portal.requiredLevel) {
            return {
                allowed: false,
                reason: `Requires level ${portal.requiredLevel}`,
                requiredLevel: portal.requiredLevel,
                currentLevel: playerLevel
            };
        }
        
        // Check combat cooldown
        if (this.isInCombatCooldown(playerId)) {
            const remaining = this.getCombatCooldownRemaining(playerId);
            return {
                allowed: false,
                reason: 'Cannot transition while in combat',
                cooldownRemaining: remaining
            };
        }
        
        // Check if already transitioning
        if (this.transitioningPlayers.has(playerId)) {
            return { allowed: false, reason: 'Already transitioning' };
        }
        
        return { allowed: true, portal };
    }
    
    /**
     * Use portal to transition between zones
     */
    async usePortal(playerId, portalId) {
        const check = await this.canUsePortal(playerId, portalId);
        if (!check.allowed) {
            return {
                success: false,
                error: check.reason,
                requiredLevel: check.requiredLevel,
                cooldownRemaining: check.cooldownRemaining
            };
        }
        
        const portal = check.portal;
        
        // Mark player as transitioning
        this.transitioningPlayers.add(playerId);
        
        try {
            // Get current zone
            const currentZone = this.zones.get(portal.fromZone);
            const targetZone = this.zones.get(portal.toZone);
            
            if (!targetZone) {
                this.transitioningPlayers.delete(playerId);
                return {
                    success: false,
                    error: `Target zone ${portal.toZone} not available`
                };
            }
            
            // Record transition in database
            await this.recordTransition(playerId, portal);
            
            // Update player zone progress
            await this.updatePlayerZone(playerId, portal.toZone, portal.toPosition);
            
            // Remove from current zone
            if (currentZone) {
                currentZone.playerLeave(playerId);
            }
            
            // Add to new zone
            targetZone.playerEnter(playerId, portal.toPosition);
            
            // Clear transition flag
            this.transitioningPlayers.delete(playerId);
            
            // Emit transition event
            this.emit('transition:completed', {
                playerId,
                fromZone: portal.fromZone,
                toZone: portal.toZone,
                position: portal.toPosition
            });
            
            return {
                success: true,
                zone: portal.toZone,
                position: portal.toPosition,
                zoneInfo: targetZone.getZoneInfo()
            };
            
        } catch (error) {
            this.transitioningPlayers.delete(playerId);
            console.error('[ZoneTransition] Transition error:', error);
            return {
                success: false,
                error: 'Transition failed'
            };
        }
    }
    
    /**
     * Record transition in database
     */
    async recordTransition(playerId, portal) {
        try {
            await this.db.run(
                `INSERT INTO zone_transitions 
                 (player_id, from_zone, to_zone, to_x, to_y) 
                 VALUES (?, ?, ?, ?, ?)`,
                [playerId, portal.fromZone, portal.toZone, portal.toPosition.x, portal.toPosition.y]
            );
        } catch (error) {
            console.error('[ZoneTransition] Error recording transition:', error);
        }
    }
    
    /**
     * Update player zone progress
     */
    async updatePlayerZone(playerId, zoneId, position) {
        try {
            // Get current progress
            const progress = await this.db.get(
                'SELECT discovered_zones FROM player_zone_progress WHERE player_id = ?',
                [playerId]
            );
            
            let discovered = ['verdantis'];
            if (progress) {
                try {
                    discovered = JSON.parse(progress.discovered_zones);
                } catch (e) {
                    discovered = ['verdantis'];
                }
            }
            
            // Add new zone if not discovered
            if (!discovered.includes(zoneId)) {
                discovered.push(zoneId);
            }
            
            // Update database
            await this.db.run(
                `INSERT OR REPLACE INTO player_zone_progress 
                 (player_id, current_zone, discovered_zones, last_position, updated_at)
                 VALUES (?, ?, ?, ?, datetime('now'))`,
                [
                    playerId,
                    zoneId,
                    JSON.stringify(discovered),
                    JSON.stringify({ x: position.x, y: position.y, zone: zoneId })
                ]
            );
            
        } catch (error) {
            console.error('[ZoneTransition] Error updating player zone:', error);
        }
    }
    
    /**
     * Get available portals for a zone
     */
    getPortalsForZone(zoneId) {
        const portals = [];
        for (const [id, portal] of this.portals) {
            if (portal.fromZone === zoneId) {
                portals.push(portal);
            }
        }
        return portals;
    }
    
    /**
     * Get portal at position
     */
    getPortalAt(zoneId, x, y, radius = 50) {
        for (const [id, portal] of this.portals) {
            if (portal.fromZone === zoneId) {
                const dx = portal.fromPosition.x - x;
                const dy = portal.fromPosition.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= radius) {
                    return portal;
                }
            }
        }
        return null;
    }
    
    /**
     * Check if player is near a portal
     */
    isNearPortal(zoneId, x, y, radius = 50) {
        return this.getPortalAt(zoneId, x, y, radius) !== null;
    }
    
    /**
     * Mark player as in combat
     */
    setPlayerCombat(playerId) {
        this.playerCombatStatus.set(playerId, Date.now());
    }
    
    /**
     * Clear player combat status
     */
    clearPlayerCombat(playerId) {
        this.playerCombatStatus.delete(playerId);
    }
    
    /**
     * Check if player is in combat cooldown
     */
    isInCombatCooldown(playerId) {
        const lastCombat = this.playerCombatStatus.get(playerId);
        if (!lastCombat) return false;
        
        return (Date.now() - lastCombat) < this.combatCooldown;
    }
    
    /**
     * Get remaining combat cooldown
     */
    getCombatCooldownRemaining(playerId) {
        const lastCombat = this.playerCombatStatus.get(playerId);
        if (!lastCombat) return 0;
        
        const remaining = this.combatCooldown - (Date.now() - lastCombat);
        return Math.max(0, remaining);
    }
    
    /**
     * Get player zone info
     */
    async getPlayerZoneInfo(playerId) {
        try {
            const progress = await this.db.get(
                'SELECT * FROM player_zone_progress WHERE player_id = ?',
                [playerId]
            );
            
            if (!progress) {
                return {
                    currentZone: 'verdantis',
                    discoveredZones: ['verdantis'],
                    lastPosition: null
                };
            }
            
            let discovered = ['verdantis'];
            let lastPosition = null;
            
            try {
                discovered = JSON.parse(progress.discovered_zones);
            } catch (e) {
                // Use default
            }
            
            try {
                lastPosition = JSON.parse(progress.last_position);
            } catch (e) {
                // Use null
            }
            
            return {
                currentZone: progress.current_zone,
                discoveredZones: discovered,
                lastPosition: lastPosition,
                updatedAt: progress.updated_at
            };
            
        } catch (error) {
            console.error('[ZoneTransition] Error getting player zone info:', error);
            return {
                currentZone: 'verdantis',
                discoveredZones: ['verdantis'],
                lastPosition: null
            };
        }
    }
    
    /**
     * Handle player login - restore zone position
     */
    async handlePlayerLogin(playerId) {
        const zoneInfo = await this.getPlayerZoneInfo(playerId);
        
        // Get the zone
        const zone = this.zones.get(zoneInfo.currentZone);
        if (!zone) {
            // Fallback to Verdantis if zone not available
            return {
                zone: 'verdantis',
                position: { x: 400, y: 300 }
            };
        }
        
        // Determine spawn position
        let spawnPosition = zoneInfo.lastPosition;
        if (!spawnPosition) {
            spawnPosition = zone.config.spawnPoints.default;
        }
        
        // Enter the zone
        zone.playerEnter(playerId, spawnPosition);
        
        return {
            zone: zoneInfo.currentZone,
            position: spawnPosition,
            discoveredZones: zoneInfo.discoveredZones,
            zoneInfo: zone.getZoneInfo()
        };
    }
    
    /**
     * Handle player disconnect
     */
    async handlePlayerDisconnect(playerId) {
        // Get current zone info
        const zoneInfo = await this.getPlayerZoneInfo(playerId);
        const zone = this.zones.get(zoneInfo.currentZone);
        
        if (zone) {
            zone.playerLeave(playerId);
        }
        
        // Clear combat status
        this.clearPlayerCombat(playerId);
        
        // Remove from transitioning set
        this.transitioningPlayers.delete(playerId);
    }
    
    /**
     * Get all available portals info for a player
     */
    async getAvailablePortals(playerId, currentZone) {
        const portals = this.getPortalsForZone(currentZone);
        const player = await this.playerManager.getPlayer(playerId);
        const playerLevel = player?.level || 1;
        
        return portals.map(portal => ({
            id: portal.id,
            name: portal.name,
            description: portal.description,
            toZone: portal.toZone,
            toZoneName: this.zones.get(portal.toZone)?.config?.name || portal.toZone,
            canUse: playerLevel >= portal.requiredLevel,
            requiredLevel: portal.requiredLevel
        }));
    }
    
    /**
     * Initialize zone for player (called on login)
     */
    async initializePlayerZone(playerId) {
        const zoneData = await this.handlePlayerLogin(playerId);
        
        // Get available portals
        const portals = await this.getAvailablePortals(playerId, zoneData.zone);
        
        return {
            ...zoneData,
            portals
        };
    }
    
    /**
     * Force player to zone (admin/respawn)
     */
    async forcePlayerToZone(playerId, zoneId, position) {
        const zone = this.zones.get(zoneId);
        if (!zone) {
            return { success: false, error: 'Zone not found' };
        }
        
        // Get current zone and remove player
        const currentZoneInfo = await this.getPlayerZoneInfo(playerId);
        const currentZone = this.zones.get(currentZoneInfo.currentZone);
        if (currentZone) {
            currentZone.playerLeave(playerId);
        }
        
        // Update player zone
        await this.updatePlayerZone(playerId, zoneId, position);
        
        // Enter new zone
        zone.playerEnter(playerId, position);
        
        return {
            success: true,
            zone: zoneId,
            position,
            zoneInfo: zone.getZoneInfo()
        };
    }
}

module.exports = ZoneTransition;
