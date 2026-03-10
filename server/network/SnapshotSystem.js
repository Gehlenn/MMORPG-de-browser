/**
 * Snapshot System
 * Generates world state snapshots for network transmission
 * Creates optimized snapshots at 20 FPS for smooth multiplayer
 */

class SnapshotSystem {
    constructor(componentManager, interestManager) {
        this.componentManager = componentManager;
        this.interestManager = interestManager;
        
        // Snapshot configuration
        this.config = {
            snapshotRate: 20,        // snapshots per second
            snapshotInterval: 50,    // milliseconds between snapshots
            maxEntitiesPerSnapshot: 200,
            compressionEnabled: true,
            includeVelocity: true,
            includeHealth: true,
            includeCombat: true,
            positionPrecision: 2,    // decimal places
            healthPrecision: 0       // integer values
        };
        
        // Snapshot state
        this.currentTick = 0;
        this.lastSnapshotTime = 0;
        this.snapshotHistory = [];
        this.maxHistorySize = 10;
        
        // Entity state tracking
        this.lastEntityStates = new Map(); // entityId -> state
        this.entitySnapshots = new Map();  // entityId -> last snapshot
        
        // Performance tracking
        this.stats = {
            totalSnapshots: 0,
            averageSnapshotTime: 0,
            averageEntitiesPerSnapshot: 0,
            totalBytesTransmitted: 0,
            compressionRatio: 0
        };
        
        // Snapshot templates for optimization
        this.snapshotTemplate = {
            tick: 0,
            timestamp: 0,
            entities: []
        };
        
        this.entityTemplate = {
            id: 0,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            hp: 0,
            maxHp: 0,
            state: 'idle'
        };
        
        console.log('📸 Snapshot System initialized');
    }

    /**
     * Create world snapshot
     * @param {number[]} playerIds - Array of player IDs
     * @returns {Map<number, object>} - Player ID -> snapshot
     */
    createWorldSnapshot(playerIds) {
        const startTime = performance.now();
        
        // Update tick
        this.currentTick++;
        const timestamp = Date.now();
        
        // Create individual player snapshots
        const playerSnapshots = new Map();
        
        for (const playerId of playerIds) {
            const snapshot = this.createPlayerSnapshot(playerId, timestamp);
            if (snapshot) {
                playerSnapshots.set(playerId, snapshot);
            }
        }
        
        // Update history
        this.updateSnapshotHistory(playerSnapshots);
        
        // Update statistics
        const snapshotTime = performance.now() - startTime;
        this.updateStats(snapshotTime, playerSnapshots.size);
        
        this.lastSnapshotTime = timestamp;
        
        return playerSnapshots;
    }

    /**
     * Create snapshot for specific player
     * @param {number} playerId - Player ID
     * @param {number} timestamp - Snapshot timestamp
     * @returns {object|null} - Player snapshot or null
     */
    createPlayerSnapshot(playerId, timestamp) {
        // Get visible entities for player
        const visibleEntities = this.interestManager.getVisibleEntities(playerId);
        
        if (visibleEntities.size === 0) {
            return null;
        }
        
        // Create snapshot structure
        const snapshot = {
            tick: this.currentTick,
            timestamp: timestamp,
            playerId: playerId,
            entities: []
        };
        
        // Add player entity first
        const playerState = this.getEntitySnapshotData(playerId);
        if (playerState) {
            snapshot.entities.push(playerState);
        }
        
        // Add visible entities
        for (const entityId of visibleEntities) {
            if (entityId === playerId) continue; // Skip player (already added)
            
            const entityData = this.getEntitySnapshotData(entityId);
            if (entityData) {
                snapshot.entities.push(entityData);
            }
            
            // Limit entities per snapshot
            if (snapshot.entities.length >= this.config.maxEntitiesPerSnapshot) {
                break;
            }
        }
        
        return snapshot.entities.length > 0 ? snapshot : null;
    }

    /**
     * Get entity snapshot data
     * @param {number} entityId - Entity ID
     * @returns {object|null} - Entity snapshot data
     */
    getEntitySnapshotData(entityId) {
        const position = this.componentManager.get(entityId, 'position');
        const velocity = this.componentManager.get(entityId, 'velocity');
        const health = this.componentManager.get(entityId, 'health');
        const combat = this.componentManager.get(entityId, 'combat');
        
        if (!position) return null;
        
        const entityData = {
            id: entityId,
            x: parseFloat(position.x.toFixed(this.config.positionPrecision)),
            y: parseFloat(position.y.toFixed(this.config.positionPrecision))
        };
        
        // Add velocity if enabled and available
        if (this.config.includeVelocity && velocity) {
            entityData.vx = parseFloat(velocity.vx.toFixed(this.config.positionPrecision));
            entityData.vy = parseFloat(velocity.vy.toFixed(this.config.positionPrecision));
        }
        
        // Add health if enabled and available
        if (this.config.includeHealth && health) {
            entityData.hp = Math.round(health.hp);
            entityData.maxHp = Math.round(health.maxHp);
            entityData.state = health.isDead ? 'dead' : 
                           (health.isLowHealth() ? 'low_health' : 'healthy');
        }
        
        // Add combat info if enabled and available
        if (this.config.includeCombat && combat) {
            entityData.level = combat.level;
            entityData.attack = combat.attack;
            entityData.defense = combat.defense;
        }
        
        return entityData;
    }

    /**
     * Create delta snapshot (only changed entities)
     * @param {number} playerId - Player ID
     * @param {number} timestamp - Snapshot timestamp
     * @returns {object|null} - Delta snapshot
     */
    createDeltaSnapshot(playerId, timestamp) {
        const visibleEntities = this.interestManager.getEntitiesNeedingUpdates(
            playerId, 
            this.lastEntityStates
        );
        
        if (visibleEntities.size === 0) {
            return null;
        }
        
        const snapshot = {
            tick: this.currentTick,
            timestamp: timestamp,
            playerId: playerId,
            entities: [],
            delta: true
        };
        
        // Add changed entities
        for (const entityId of visibleEntities) {
            const entityData = this.getEntitySnapshotData(entityId);
            if (entityData) {
                snapshot.entities.push(entityData);
                
                // Update last known state
                this.lastEntityStates.set(entityId, this.getEntityState(entityId));
            }
        }
        
        return snapshot.entities.length > 0 ? snapshot : null;
    }

    /**
     * Get entity state for comparison
     * @param {number} entityId - Entity ID
     * @returns {object} - Entity state
     */
    getEntityState(entityId) {
        const position = this.componentManager.get(entityId, 'position');
        const velocity = this.componentManager.get(entityId, 'velocity');
        const health = this.componentManager.get(entityId, 'health');
        
        return {
            x: position ? parseFloat(position.x.toFixed(this.config.positionPrecision)) : 0,
            y: position ? parseFloat(position.y.toFixed(this.config.positionPrecision)) : 0,
            vx: velocity ? parseFloat(velocity.vx.toFixed(this.config.positionPrecision)) : 0,
            vy: velocity ? parseFloat(velocity.vy.toFixed(this.config.positionPrecision)) : 0,
            hp: health ? Math.round(health.hp) : 0,
            maxHp: health ? Math.round(health.maxHp) : 0
        };
    }

    /**
     * Update snapshot history
     * @param {Map<number, object>} snapshots - Current snapshots
     */
    updateSnapshotHistory(snapshots) {
        const historyEntry = {
            tick: this.currentTick,
            timestamp: Date.now(),
            snapshots: new Map(snapshots)
        };
        
        this.snapshotHistory.push(historyEntry);
        
        // Limit history size
        if (this.snapshotHistory.length > this.maxHistorySize) {
            this.snapshotHistory.shift();
        }
    }

    /**
     * Get snapshot history for interpolation
     * @param {number} playerId - Player ID
     * @param {number} count - Number of snapshots to retrieve
     * @returns {object[]} - Array of snapshots
     */
    getSnapshotHistory(playerId, count = 2) {
        const history = [];
        
        // Get recent snapshots for player
        for (let i = this.snapshotHistory.length - 1; i >= 0 && history.length < count; i--) {
            const entry = this.snapshotHistory[i];
            const playerSnapshot = entry.snapshots.get(playerId);
            
            if (playerSnapshot) {
                history.push(playerSnapshot);
            }
        }
        
        return history.reverse(); // Return in chronological order
    }

    /**
     * Check if snapshot is needed
     * @param {number} currentTime - Current timestamp
     * @returns {boolean} - True if snapshot should be created
     */
    shouldCreateSnapshot(currentTime) {
        return currentTime - this.lastSnapshotTime >= this.config.snapshotInterval;
    }

    /**
     * Serialize snapshot for network transmission
     * @param {object} snapshot - Snapshot object
     * @returns {string} - Serialized snapshot
     */
    serializeSnapshot(snapshot) {
        if (this.config.compressionEnabled) {
            return JSON.stringify(snapshot);
        }
        
        return JSON.stringify(snapshot);
    }

    /**
     * Deserialize snapshot from network data
     * @param {string} data - Serialized snapshot data
     * @returns {object} - Deserialized snapshot
     */
    deserializeSnapshot(data) {
        try {
            return JSON.parse(data);
        } catch (error) {
            console.error('❌ Failed to deserialize snapshot:', error);
            return null;
        }
    }

    /**
     * Get snapshot size in bytes
     * @param {object} snapshot - Snapshot object
     * @returns {number} - Size in bytes
     */
    getSnapshotSize(snapshot) {
        return Buffer.byteLength(JSON.stringify(snapshot), 'utf8');
    }

    /**
     * Update performance statistics
     * @param {number} snapshotTime - Time to create snapshot
     * @param {number} playerCount - Number of player snapshots
     */
    updateStats(snapshotTime, playerCount) {
        this.stats.totalSnapshots++;
        this.stats.averageSnapshotTime = 
            (this.stats.averageSnapshotTime * (this.stats.totalSnapshots - 1) + snapshotTime) / 
            this.stats.totalSnapshots;
        
        const entitiesPerSnapshot = playerCount > 0 ? 
            this.stats.totalEntitiesTracked / this.stats.totalSnapshots : 0;
        this.stats.averageEntitiesPerSnapshot = entitiesPerSnapshot;
    }

    /**
     * Get performance statistics
     * @returns {object} - Performance stats
     */
    getStats() {
        return {
            ...this.stats,
            currentTick: this.currentTick,
            snapshotRate: this.config.snapshotRate,
            historySize: this.snapshotHistory.length,
            trackedEntities: this.lastEntityStates.size
        };
    }

    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            totalSnapshots: 0,
            averageSnapshotTime: 0,
            averageEntitiesPerSnapshot: 0,
            totalBytesTransmitted: 0,
            compressionRatio: 0
        };
    }

    /**
     * Clear snapshot history
     */
    clearHistory() {
        this.snapshotHistory = [];
        this.lastEntityStates.clear();
        this.entitySnapshots.clear();
    }

    /**
     * Update configuration
     * @param {object} newConfig - New configuration
     */
    updateConfig(newConfig) {
        Object.assign(this.config, newConfig);
        
        // Update interval based on rate
        this.config.snapshotInterval = 1000 / this.config.snapshotRate;
        
        console.log('📸 Snapshot configuration updated:', newConfig);
    }

    /**
     * Get entity count in last snapshot
     * @param {number} playerId - Player ID
     * @returns {number} - Entity count
     */
    getLastEntityCount(playerId) {
        if (this.snapshotHistory.length === 0) return 0;
        
        const lastEntry = this.snapshotHistory[this.snapshotHistory.length - 1];
        const lastSnapshot = lastEntry.snapshots.get(playerId);
        
        return lastSnapshot ? lastSnapshot.entities.length : 0;
    }

    /**
     * Debug visualization
     * @returns {object} - Debug information
     */
    debugVisualization() {
        return {
            config: this.config,
            stats: this.getStats(),
            currentTick: this.currentTick,
            historySize: this.snapshotHistory.length,
            trackedEntities: this.lastEntityStates.size,
            lastSnapshotTime: this.lastSnapshotTime
        };
    }
}

module.exports = SnapshotSystem;
