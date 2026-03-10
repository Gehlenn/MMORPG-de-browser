/**
 * Client Snapshot Handler
 * Receives and processes world snapshots from server
 * Manages entity state updates and interpolation
 */

class SnapshotHandler {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        
        // Snapshot configuration
        this.config = {
            maxHistorySize: 10,
            interpolationDelay: 100, // milliseconds
            enablePrediction: true,
            enableExtrapolation: false,
            maxExtrapolationTime: 500 // milliseconds
        };
        
        // Snapshot management
        this.snapshotHistory = [];
        this.lastSnapshot = null;
        this.currentTick = 0;
        
        // Entity state management
        this.entityStates = new Map(); // entityId -> entity state
        this.localEntities = new Map(); // entityId -> local entity
        this.removedEntities = new Set(); // Set of removed entity IDs
        
        // Interpolation
        this.interpolationSystem = null;
        
        // Performance tracking
        this.stats = {
            snapshotsReceived: 0,
            snapshotsProcessed: 0,
            entitiesUpdated: 0,
            averageProcessingTime: 0,
            networkLatency: 0,
            packetLoss: 0
        };
        
        // Connection state
        this.connected = false;
        this.lastSnapshotTime = 0;
        this.expectedSnapshotInterval = 50; // 20 FPS
        
        console.log('📡 Client Snapshot Handler initialized');
    }

    /**
     * Initialize snapshot handler
     */
    initialize() {
        // Initialize interpolation system
        this.interpolationSystem = new InterpolationSystem(this.gameEngine);
        this.interpolationSystem.initialize();
        
        // Setup network event handlers
        this.setupNetworkHandlers();
        
        console.log('📡 Snapshot handler initialized with interpolation');
    }

    /**
     * Setup network event handlers
     */
    setupNetworkHandlers() {
        if (this.gameEngine.socket) {
            this.gameEngine.socket.on('worldSnapshot', (snapshot) => {
                this.handleSnapshot(snapshot);
            });
            
            this.gameEngine.socket.on('connect', () => {
                this.connected = true;
                console.log('📡 Connected to server');
            });
            
            this.gameEngine.socket.on('disconnect', () => {
                this.connected = false;
                console.log('📡 Disconnected from server');
            });
        }
    }

    /**
     * Handle incoming snapshot
     * @param {object} snapshot - World snapshot from server
     */
    handleSnapshot(snapshot) {
        const startTime = performance.now();
        
        // Update statistics
        this.stats.snapshotsReceived++;
        this.lastSnapshotTime = Date.now();
        
        // Validate snapshot
        if (!this.validateSnapshot(snapshot)) {
            console.warn('📡 Invalid snapshot received:', snapshot);
            return;
        }
        
        // Add to history
        this.addToHistory(snapshot);
        
        // Process snapshot
        this.processSnapshot(snapshot);
        
        // Update interpolation
        this.updateInterpolation();
        
        // Update statistics
        const processingTime = performance.now() - startTime;
        this.updateStats(processingTime);
        
        // Clean old data
        this.cleanup();
    }

    /**
     * Validate incoming snapshot
     * @param {object} snapshot - Snapshot to validate
     * @returns {boolean} - True if valid
     */
    validateSnapshot(snapshot) {
        if (!snapshot || typeof snapshot !== 'object') {
            return false;
        }
        
        if (!snapshot.tick || !snapshot.timestamp || !snapshot.entities) {
            return false;
        }
        
        if (!Array.isArray(snapshot.entities)) {
            return false;
        }
        
        return true;
    }

    /**
     * Add snapshot to history
     * @param {object} snapshot - Snapshot to add
     */
    addToHistory(snapshot) {
        this.snapshotHistory.push({
            ...snapshot,
            receivedAt: Date.now()
        });
        
        // Limit history size
        if (this.snapshotHistory.length > this.config.maxHistorySize) {
            this.snapshotHistory.shift();
        }
        
        this.lastSnapshot = snapshot;
        this.currentTick = snapshot.tick;
    }

    /**
     * Process snapshot and update entities
     * @param {object} snapshot - Snapshot to process
     */
    processSnapshot(snapshot) {
        // Track entities in this snapshot
        const currentEntities = new Set();
        let entitiesUpdated = 0;
        
        // Process entities
        for (const entityData of snapshot.entities) {
            currentEntities.add(entityData.id);
            
            // Update entity state
            const updated = this.updateEntity(entityData);
            if (updated) {
                entitiesUpdated++;
            }
        }
        
        // Handle removed entities
        if (snapshot.removedEntities) {
            for (const entityId of snapshot.removedEntities) {
                this.removeEntity(entityId);
            }
        }
        
        // Clean up entities not in current snapshot
        this.cleanupEntities(currentEntities);
        
        this.stats.entitiesUpdated += entitiesUpdated;
        this.stats.snapshotsProcessed++;
    }

    /**
     * Update entity with snapshot data
     * @param {object} entityData - Entity data from snapshot
     * @returns {boolean} - True if entity was updated
     */
    updateEntity(entityData) {
        const entityId = entityData.id;
        
        // Get or create entity state
        let entityState = this.entityStates.get(entityId);
        if (!entityState) {
            entityState = {
                id: entityId,
                lastUpdate: Date.now(),
                snapshots: []
            };
            this.entityStates.set(entityId, entityState);
        }
        
        // Add snapshot to entity history
        entityState.snapshots.push({
            ...entityData,
            timestamp: Date.now()
        });
        
        // Limit entity snapshot history
        if (entityState.snapshots.length > 5) {
            entityState.snapshots.shift();
        }
        
        // Update local entity if exists
        const localEntity = this.localEntities.get(entityId);
        if (localEntity) {
            return this.updateLocalEntity(localEntity, entityData);
        }
        
        // Create new local entity if needed
        return this.createLocalEntity(entityData);
    }

    /**
     * Update local entity with snapshot data
     * @param {object} localEntity - Local entity object
     * @param {object} entityData - Entity data from snapshot
     * @returns {boolean} - True if entity was updated
     */
    updateLocalEntity(localEntity, entityData) {
        let updated = false;
        
        // Update position
        if (entityData.x !== undefined && entityData.y !== undefined) {
            // Store server position for interpolation
            localEntity.serverPosition = { x: entityData.x, y: entityData.y };
            localEntity.positionTimestamp = Date.now();
            updated = true;
        }
        
        // Update velocity
        if (entityData.vx !== undefined && entityData.vy !== undefined) {
            localEntity.velocity = { x: entityData.vx, y: entityData.vy };
            updated = true;
        }
        
        // Update health
        if (entityData.hp !== undefined) {
            localEntity.health = entityData.hp;
            localEntity.maxHealth = entityData.maxHp || localEntity.maxHealth;
            updated = true;
        }
        
        // Update state
        if (entityData.state !== undefined) {
            localEntity.state = entityData.state;
            updated = true;
        }
        
        // Update combat info
        if (entityData.level !== undefined) {
            localEntity.level = entityData.level;
            updated = true;
        }
        
        if (entityData.attack !== undefined) {
            localEntity.attack = entityData.attack;
            updated = true;
        }
        
        if (entityData.defense !== undefined) {
            localEntity.defense = entityData.defense;
            updated = true;
        }
        
        return updated;
    }

    /**
     * Create new local entity
     * @param {object} entityData - Entity data from snapshot
     * @returns {boolean} - True if entity was created
     */
    createLocalEntity(entityData) {
        const localEntity = {
            id: entityData.id,
            type: this.determineEntityType(entityData),
            serverPosition: { x: entityData.x, y: entityData.y },
            localPosition: { x: entityData.x, y: entityData.y },
            velocity: entityData.vx !== undefined ? { x: entityData.vx, y: entityData.vy } : { x: 0, y: 0 },
            health: entityData.hp || 100,
            maxHealth: entityData.maxHp || 100,
            state: entityData.state || 'idle',
            level: entityData.level || 1,
            attack: entityData.attack || 0,
            defense: entityData.defense || 0,
            positionTimestamp: Date.now(),
            created: Date.now()
        };
        
        this.localEntities.set(entityData.id, localEntity);
        
        // Notify game engine of new entity
        if (this.gameEngine.onEntityCreated) {
            this.gameEngine.onEntityCreated(localEntity);
        }
        
        return true;
    }

    /**
     * Determine entity type from data
     * @param {object} entityData - Entity data
     * @returns {string} - Entity type
     */
    determineEntityType(entityData) {
        if (entityData.attack > 0) {
            return 'mob';
        } else if (entityData.attack === 0 && entityData.hp > 0) {
            return 'npc';
        } else {
            return 'player';
        }
    }

    /**
     * Remove entity
     * @param {number} entityId - Entity ID to remove
     */
    removeEntity(entityId) {
        this.entityStates.delete(entityId);
        this.localEntities.delete(entityId);
        this.removedEntities.add(entityId);
        
        // Notify game engine of removed entity
        if (this.gameEngine.onEntityRemoved) {
            this.gameEngine.onEntityRemoved(entityId);
        }
    }

    /**
     * Clean up entities not in current snapshot
     * @param {Set<number>} currentEntities - Current entity IDs
     */
    cleanupEntities(currentEntities) {
        for (const [entityId] of this.localEntities) {
            if (!currentEntities.has(entityId)) {
                // Check if entity should be removed (timeout)
                const entity = this.localEntities.get(entityId);
                if (entity && Date.now() - entity.positionTimestamp > 5000) {
                    this.removeEntity(entityId);
                }
            }
        }
    }

    /**
     * Update interpolation system
     */
    updateInterpolation() {
        if (this.interpolationSystem) {
            this.interpolationSystem.update(this.localEntities);
        }
    }

    /**
     * Get interpolated position for entity
     * @param {number} entityId - Entity ID
     * @param {number} renderTime - Render timestamp
     * @returns {object|null} - Interpolated position
     */
    getInterpolatedPosition(entityId, renderTime) {
        if (this.interpolationSystem) {
            return this.interpolationSystem.getInterpolatedPosition(entityId, renderTime);
        }
        
        const entity = this.localEntities.get(entityId);
        return entity ? entity.localPosition : null;
    }

    /**
     * Get entity state
     * @param {number} entityId - Entity ID
     * @returns {object|null} - Entity state
     */
    getEntityState(entityId) {
        return this.localEntities.get(entityId) || null;
    }

    /**
     * Get all local entities
     * @returns {Map<number, object>} - Local entities
     */
    getAllEntities() {
        return this.localEntities;
    }

    /**
     * Update performance statistics
     * @param {number} processingTime - Processing time in milliseconds
     */
    updateStats(processingTime) {
        this.stats.averageProcessingTime = 
            (this.stats.averageProcessingTime * (this.stats.snapshotsProcessed - 1) + processingTime) / 
            this.stats.snapshotsProcessed;
        
        // Calculate network latency
        if (this.lastSnapshot) {
            const latency = Date.now() - this.lastSnapshot.timestamp;
            this.stats.networkLatency = latency;
        }
        
        // Calculate packet loss (simplified)
        const expectedSnapshots = Math.floor((Date.now() - this.lastSnapshotTime) / this.expectedSnapshotInterval);
        this.stats.packetLoss = Math.max(0, expectedSnapshots - this.snapshotHistory.length);
    }

    /**
     * Clean up old data
     */
    cleanup() {
        // Clean old snapshots
        const now = Date.now();
        const maxAge = 10000; // 10 seconds
        
        this.snapshotHistory = this.snapshotHistory.filter(
            snapshot => now - snapshot.receivedAt < maxAge
        );
        
        // Clean old entity states
        for (const [entityId, entityState] of this.entityStates) {
            entityState.snapshots = entityState.snapshots.filter(
                snapshot => now - snapshot.timestamp < maxAge
            );
            
            if (entityState.snapshots.length === 0) {
                this.entityStates.delete(entityId);
            }
        }
    }

    /**
     * Get performance statistics
     * @returns {object} - Performance stats
     */
    getStats() {
        return {
            ...this.stats,
            historySize: this.snapshotHistory.length,
            entityCount: this.localEntities.size,
            connected: this.connected,
            currentTick: this.currentTick
        };
    }

    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            snapshotsReceived: 0,
            snapshotsProcessed: 0,
            entitiesUpdated: 0,
            averageProcessingTime: 0,
            networkLatency: 0,
            packetLoss: 0
        };
    }

    /**
     * Clear all data
     */
    clear() {
        this.snapshotHistory = [];
        this.lastSnapshot = null;
        this.entityStates.clear();
        this.localEntities.clear();
        this.removedEntities.clear();
        this.currentTick = 0;
        
        if (this.interpolationSystem) {
            this.interpolationSystem.clear();
        }
    }

    /**
     * Debug visualization
     * @returns {object} - Debug information
     */
    debugVisualization() {
        return {
            config: this.config,
            stats: this.getStats(),
            historySize: this.snapshotHistory.length,
            entityCount: this.localEntities.size,
            lastSnapshot: this.lastSnapshot ? {
                tick: this.lastSnapshot.tick,
                entityCount: this.lastSnapshot.entities.length,
                timestamp: this.lastSnapshot.timestamp
            } : null
        };
    }
}

module.exports = SnapshotHandler;
