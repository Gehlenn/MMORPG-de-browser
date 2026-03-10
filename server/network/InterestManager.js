/**
 * Interest Manager
 * Determines which entities are visible to each player
 * Uses Spatial Grid for efficient proximity queries
 */

class InterestManager {
    constructor(spatialGrid, componentManager) {
        this.spatialGrid = spatialGrid;
        this.componentManager = componentManager;
        
        // Interest management configuration
        this.config = {
            defaultViewRadius: 300, // pixels
            maxViewRadius: 500,      // pixels
            minViewRadius: 100,      // pixels
            updateInterval: 100,     // milliseconds
            maxEntitiesPerPlayer: 100,
            priorityEntities: ['player', 'npc'], // Always visible types
            cullingDistance: 800     // Distance to completely cull entities
        };
        
        // Player interest maps
        this.playerInterests = new Map(); // playerId -> Set<entityId>
        this.playerViewRadius = new Map(); // playerId -> viewRadius
        this.lastUpdateTime = new Map();   // playerId -> lastUpdate
        
        // Performance tracking
        this.stats = {
            totalQueries: 0,
            averageQueryTime: 0,
            totalEntitiesTracked: 0,
            averageEntitiesPerPlayer: 0,
            updateOperations: 0
        };
        
        // Interest cache for optimization
        this.interestCache = new Map(); // playerId -> {entities, timestamp}
        this.cacheTimeout = 50; // milliseconds
        
        console.log('🌐 Interest Manager initialized');
    }

    /**
     * Set view radius for player
     * @param {number} playerId - Player ID
     * @param {number} radius - View radius in pixels
     */
    setPlayerViewRadius(playerId, radius) {
        const clampedRadius = Math.max(
            this.config.minViewRadius,
            Math.min(this.config.maxViewRadius, radius)
        );
        
        this.playerViewRadius.set(playerId, clampedRadius);
        
        // Clear cache when radius changes
        this.interestCache.delete(playerId);
        
        console.log(`👁️ Player ${playerId} view radius set to ${clampedRadius}px`);
    }

    /**
     * Get visible entities for player
     * @param {number} playerId - Player ID
     * @returns {Set<number>} - Set of visible entity IDs
     */
    getVisibleEntities(playerId) {
        const startTime = performance.now();
        
        // Check cache first
        const cached = this.interestCache.get(playerId);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.entities;
        }
        
        // Get player position
        const playerPos = this.getPlayerPosition(playerId);
        if (!playerPos) {
            return new Set();
        }
        
        // Get view radius
        const viewRadius = this.playerViewRadius.get(playerId) || this.config.defaultViewRadius;
        
        // Query spatial grid for nearby entities
        const nearbyEntities = this.spatialGrid.getNearbyEntities(
            playerPos.x, 
            playerPos.y, 
            viewRadius
        );
        
        // Filter and prioritize entities
        const visibleEntities = this.filterVisibleEntities(playerId, nearbyEntities, playerPos, viewRadius);
        
        // Limit entities per player for performance
        const limitedEntities = this.limitEntities(visibleEntities);
        
        // Update cache
        this.interestCache.set(playerId, {
            entities: limitedEntities,
            timestamp: Date.now()
        });
        
        // Update player interests
        this.playerInterests.set(playerId, limitedEntities);
        this.lastUpdateTime.set(playerId, Date.now());
        
        // Update statistics
        const queryTime = performance.now() - startTime;
        this.updateStats(queryTime, limitedEntities.size);
        
        return limitedEntities;
    }

    /**
     * Get player position from ECS
     * @param {number} playerId - Player ID
     * @returns {object|null} - Position {x, y} or null
     */
    getPlayerPosition(playerId) {
        // For now, we'll use a simple lookup
        // In a full implementation, this would query the ECS system
        const position = this.componentManager.get(playerId, 'position');
        if (position) {
            return { x: position.x, y: position.y };
        }
        
        // Fallback to legacy system if ECS not available
        if (this.legacyPlayerLookup) {
            return this.legacyPlayerLookup(playerId);
        }
        
        return null;
    }

    /**
     * Filter entities based on visibility rules
     * @param {number} playerId - Player ID
     * @param {Set<number>} entities - Nearby entities
     * @param {object} playerPos - Player position
     * @param {number} viewRadius - View radius
     * @returns {Set<number>} - Filtered visible entities
     */
    filterVisibleEntities(playerId, entities, playerPos, viewRadius) {
        const visible = new Set();
        
        for (const entityId of entities) {
            // Skip self
            if (entityId === playerId) continue;
            
            // Get entity position
            const entityPos = this.getEntityPosition(entityId);
            if (!entityPos) continue;
            
            // Calculate distance
            const distance = Math.sqrt(
                Math.pow(entityPos.x - playerPos.x, 2) + 
                Math.pow(entityPos.y - playerPos.y, 2)
            );
            
            // Check if within culling distance
            if (distance > this.config.cullingDistance) continue;
            
            // Check visibility rules
            if (this.isEntityVisible(playerId, entityId, distance, viewRadius)) {
                visible.add(entityId);
            }
        }
        
        return visible;
    }

    /**
     * Check if entity should be visible to player
     * @param {number} playerId - Player ID
     * @param {number} entityId - Entity ID
     * @param {number} distance - Distance to entity
     * @param {number} viewRadius - Player view radius
     * @returns {boolean} - True if entity should be visible
     */
    isEntityVisible(playerId, entityId, distance, viewRadius) {
        // Always visible if within view radius
        if (distance <= viewRadius) {
            return true;
        }
        
        // Check for priority entities
        const entityType = this.getEntityType(entityId);
        if (this.config.priorityEntities.includes(entityType)) {
            return distance <= viewRadius * 1.5; // Extended range for priority entities
        }
        
        // Line of sight check (simplified)
        if (this.hasLineOfSight(playerId, entityId)) {
            return distance <= viewRadius * 1.2;
        }
        
        return false;
    }

    /**
     * Get entity position
     * @param {number} entityId - Entity ID
     * @returns {object|null} - Position or null
     */
    getEntityPosition(entityId) {
        const position = this.componentManager.get(entityId, 'position');
        return position ? { x: position.x, y: position.y } : null;
    }

    /**
     * Get entity type
     * @param {number} entityId - Entity ID
     * @returns {string} - Entity type
     */
    getEntityType(entityId) {
        // Check combat component for mobs
        const combat = this.componentManager.get(entityId, 'combat');
        if (combat && combat.attack > 0) {
            return 'mob';
        }
        
        // Check health component for NPCs
        const health = this.componentManager.get(entityId, 'health');
        if (health && combat && combat.attack === 0) {
            return 'npc';
        }
        
        // Default to player
        return 'player';
    }

    /**
     * Simple line of sight check
     * @param {number} playerId - Player ID
     * @param {number} entityId - Entity ID
     * @returns {boolean} - True if has line of sight
     */
    hasLineOfSight(playerId, entityId) {
        // Simplified LOS check - in a full implementation this would
        // check for obstacles between player and entity
        return true;
    }

    /**
     * Limit entities per player for performance
     * @param {Set<number>} entities - Entity set
     * @returns {Set<number>} - Limited entity set
     */
    limitEntities(entities) {
        if (entities.size <= this.config.maxEntitiesPerPlayer) {
            return entities;
        }
        
        // Convert to array and sort by priority
        const entityArray = Array.from(entities);
        entityArray.sort((a, b) => {
            // Priority: players > npcs > mobs
            const typeA = this.getEntityType(a);
            const typeB = this.getEntityType(b);
            
            const priorityA = this.getEntityPriority(typeA);
            const priorityB = this.getEntityPriority(typeB);
            
            return priorityB - priorityA;
        });
        
        // Take top entities
        return new Set(entityArray.slice(0, this.config.maxEntitiesPerPlayer));
    }

    /**
     * Get entity priority for sorting
     * @param {string} entityType - Entity type
     * @returns {number} - Priority value (higher = more important)
     */
    getEntityPriority(entityType) {
        switch (entityType) {
            case 'player': return 3;
            case 'npc': return 2;
            case 'mob': return 1;
            default: return 0;
        }
    }

    /**
     * Update interest management for all players
     * @param {number[]} playerIds - Array of player IDs
     */
    updateAllPlayers(playerIds) {
        const startTime = performance.now();
        
        for (const playerId of playerIds) {
            this.getVisibleEntities(playerId);
        }
        
        // Clean old cache entries
        this.cleanupCache();
        
        const updateTime = performance.now() - startTime;
        console.log(`🌐 Updated interests for ${playerIds.length} players in ${updateTime.toFixed(2)}ms`);
    }

    /**
     * Clean old cache entries
     */
    cleanupCache() {
        const now = Date.now();
        
        for (const [playerId, cached] of this.interestCache) {
            if (now - cached.timestamp > this.cacheTimeout * 2) {
                this.interestCache.delete(playerId);
            }
        }
    }

    /**
     * Get entities that need updates for player
     * @param {number} playerId - Player ID
     * @param {Map<number, object>} lastKnownStates - Last known entity states
     * @returns {Set<number>} - Entities that need updates
     */
    getEntitiesNeedingUpdates(playerId, lastKnownStates) {
        const visibleEntities = this.getVisibleEntities(playerId);
        const needingUpdates = new Set();
        
        for (const entityId of visibleEntities) {
            const lastKnown = lastKnownStates.get(entityId);
            const current = this.getEntityState(entityId);
            
            if (!lastKnown || this.hasStateChanged(lastKnown, current)) {
                needingUpdates.add(entityId);
            }
        }
        
        return needingUpdates;
    }

    /**
     * Get entity state for comparison
     * @param {number} entityId - Entity ID
     * @returns {object} - Entity state
     */
    getEntityState(entityId) {
        const position = this.componentManager.get(entityId, 'position');
        const health = this.componentManager.get(entityId, 'health');
        const velocity = this.componentManager.get(entityId, 'velocity');
        
        return {
            x: position ? position.x : 0,
            y: position ? position.y : 0,
            hp: health ? health.hp : 0,
            maxHp: health ? health.maxHp : 0,
            vx: velocity ? velocity.vx : 0,
            vy: velocity ? velocity.vy : 0
        };
    }

    /**
     * Check if entity state has changed
     * @param {object} previous - Previous state
     * @param {object} current - Current state
     * @returns {boolean} - True if state changed
     */
    hasStateChanged(previous, current) {
        // Check position changes (with threshold for floating point precision)
        const positionThreshold = 0.1;
        if (Math.abs(previous.x - current.x) > positionThreshold ||
            Math.abs(previous.y - current.y) > positionThreshold) {
            return true;
        }
        
        // Check health changes
        if (previous.hp !== current.hp) {
            return true;
        }
        
        // Check velocity changes
        if (previous.vx !== current.vx || previous.vy !== current.vy) {
            return true;
        }
        
        return false;
    }

    /**
     * Remove player from interest management
     * @param {number} playerId - Player ID
     */
    removePlayer(playerId) {
        this.playerInterests.delete(playerId);
        this.playerViewRadius.delete(playerId);
        this.lastUpdateTime.delete(playerId);
        this.interestCache.delete(playerId);
        
        console.log(`🌐 Removed player ${playerId} from interest management`);
    }

    /**
     * Update performance statistics
     * @param {number} queryTime - Query time in milliseconds
     * @param {number} entityCount - Number of entities found
     */
    updateStats(queryTime, entityCount) {
        this.stats.totalQueries++;
        this.stats.averageQueryTime = 
            (this.stats.averageQueryTime * (this.stats.totalQueries - 1) + queryTime) / 
            this.stats.totalQueries;
        
        this.stats.totalEntitiesTracked += entityCount;
        this.stats.averageEntitiesPerPlayer = 
            this.stats.totalEntitiesTracked / this.stats.totalQueries;
        
        this.stats.updateOperations++;
    }

    /**
     * Get performance statistics
     * @returns {object} - Performance stats
     */
    getStats() {
        return {
            ...this.stats,
            activePlayers: this.playerInterests.size,
            cacheSize: this.interestCache.size,
            averageViewRadius: this.getAverageViewRadius()
        };
    }

    /**
     * Get average view radius
     * @returns {number} - Average view radius
     */
    getAverageViewRadius() {
        if (this.playerViewRadius.size === 0) return this.config.defaultViewRadius;
        
        let total = 0;
        for (const radius of this.playerViewRadius.values()) {
            total += radius;
        }
        
        return total / this.playerViewRadius.size;
    }

    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            totalQueries: 0,
            averageQueryTime: 0,
            totalEntitiesTracked: 0,
            averageEntitiesPerPlayer: 0,
            updateOperations: 0
        };
    }

    /**
     * Set legacy player lookup function
     * @param {function} lookupFunction - Function to get player position
     */
    setLegacyPlayerLookup(lookupFunction) {
        this.legacyPlayerLookup = lookupFunction;
    }

    /**
     * Debug visualization
     * @returns {object} - Debug information
     */
    debugVisualization() {
        const playerData = {};
        
        for (const [playerId, entities] of this.playerInterests) {
            playerData[playerId] = {
                entityCount: entities.size,
                viewRadius: this.playerViewRadius.get(playerId) || this.config.defaultViewRadius,
                lastUpdate: this.lastUpdateTime.get(playerId) || 0,
                entities: Array.from(entities)
            };
        }
        
        return {
            config: this.config,
            stats: this.getStats(),
            players: playerData
        };
    }
}

module.exports = InterestManager;
