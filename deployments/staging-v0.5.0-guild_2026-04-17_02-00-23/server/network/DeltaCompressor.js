/**
 * Delta Compressor
 * Compresses snapshots by sending only changed data
 * Implements efficient delta compression for network optimization
 */

class DeltaCompressor {
    constructor() {
        // Compression configuration
        this.config = {
            enabled: true,
            positionThreshold: 0.1,    // Minimum position change to send
            healthThreshold: 1,         // Minimum health change to send
            velocityThreshold: 0.01,   // Minimum velocity change to send
            maxDeltaSize: 1024,        // Maximum delta size in bytes
            compressionLevel: 'medium', // low, medium, high
            includeRemovedEntities: true,
            fieldPriority: {
                x: 1,
                y: 1,
                vx: 2,
                vy: 2,
                hp: 3,
                maxHp: 4,
                state: 5,
                level: 6
            }
        };
        
        // State tracking
        this.lastSnapshots = new Map(); // playerId -> last snapshot
        this.entityStates = new Map(); // entityId -> last state
        this.removedEntities = new Map(); // playerId -> Set<entityId>
        
        // Compression statistics
        this.stats = {
            totalCompressions: 0,
            averageCompressionRatio: 0,
            bandwidthSaved: 0,
            averageDeltaSize: 0,
            fieldsCompressed: {}
        };
        
        // Field compression counters
        this.fieldStats = {
            x: { sent: 0, skipped: 0 },
            y: { sent: 0, skipped: 0 },
            vx: { sent: 0, skipped: 0 },
            vy: { sent: 0, skipped: 0 },
            hp: { sent: 0, skipped: 0 },
            maxHp: { sent: 0, skipped: 0 },
            state: { sent: 0, skipped: 0 },
            level: { sent: 0, skipped: 0 }
        };
        
        console.log('🗜️ Delta Compressor initialized');
    }

    /**
     * Compress snapshot by creating delta
     * @param {object} currentSnapshot - Current snapshot
     * @param {number} playerId - Player ID
     * @returns {object} - Compressed delta snapshot
     */
    compressSnapshot(currentSnapshot, playerId) {
        if (!this.config.enabled) {
            return currentSnapshot; // Return full snapshot if compression disabled
        }
        
        const startTime = performance.now();
        
        // Get last snapshot for player
        const lastSnapshot = this.lastSnapshots.get(playerId);
        
        if (!lastSnapshot) {
            // First snapshot, send full
            this.lastSnapshots.set(playerId, currentSnapshot);
            return this.createFullSnapshot(currentSnapshot);
        }
        
        // Create delta
        const delta = this.createDelta(currentSnapshot, lastSnapshot, playerId);
        
        // Update last snapshot
        this.lastSnapshots.set(playerId, currentSnapshot);
        
        // Update statistics
        const compressionTime = performance.now() - startTime;
        this.updateCompressionStats(delta, currentSnapshot, compressionTime);
        
        return delta;
    }

    /**
     * Create delta between snapshots
     * @param {object} current - Current snapshot
     * @param {object} last - Last snapshot
     * @param {number} playerId - Player ID
     * @returns {object} - Delta snapshot
     */
    createDelta(current, last, playerId) {
        const delta = {
            tick: current.tick,
            timestamp: current.timestamp,
            playerId: playerId,
            delta: true,
            entities: [],
            removedEntities: []
        };
        
        // Track current entities
        const currentEntityIds = new Set();
        
        // Process current entities
        for (const currentEntity of current.entities) {
            currentEntityIds.add(currentEntity.id);
            
            // Find corresponding entity in last snapshot
            const lastEntity = last.entities.find(e => e.id === currentEntity.id);
            
            if (!lastEntity) {
                // New entity, send full data
                delta.entities.push(this.createFullEntity(currentEntity));
                this.updateFieldStats(currentEntity, null);
            } else {
                // Compare entities and send only changes
                const entityDelta = this.compareEntities(currentEntity, lastEntity);
                if (entityDelta) {
                    delta.entities.push(entityDelta);
                    this.updateFieldStats(currentEntity, lastEntity);
                }
            }
        }
        
        // Find removed entities
        if (this.config.includeRemovedEntities) {
            const lastEntityIds = new Set(last.entities.map(e => e.id));
            const removedSet = this.removedEntities.get(playerId) || new Set();
            
            for (const lastEntityId of lastEntityIds) {
                if (!currentEntityIds.has(lastEntityId)) {
                    delta.removedEntities.push(lastEntityId);
                    removedSet.add(lastEntityId);
                }
            }
            
            this.removedEntities.set(playerId, removedSet);
        }
        
        // Check if delta is too large, send full snapshot instead
        const deltaSize = this.getSnapshotSize(delta);
        if (deltaSize > this.config.maxDeltaSize) {
            return this.createFullSnapshot(current);
        }
        
        return delta.entities.length > 0 || delta.removedEntities.length > 0 ? delta : null;
    }

    /**
     * Compare two entities and create delta
     * @param {object} current - Current entity
     * @param {object} last - Last entity
     * @returns {object|null} - Entity delta or null if no changes
     */
    compareEntities(current, last) {
        const delta = { id: current.id };
        let hasChanges = false;
        
        // Compare position
        if (this.compareField('x', current.x, last.x)) {
            delta.x = current.x;
            hasChanges = true;
        }
        
        if (this.compareField('y', current.y, last.y)) {
            delta.y = current.y;
            hasChanges = true;
        }
        
        // Compare velocity
        if (this.compareField('vx', current.vx, last.vx)) {
            delta.vx = current.vx;
            hasChanges = true;
        }
        
        if (this.compareField('vy', current.vy, last.vy)) {
            delta.vy = current.vy;
            hasChanges = true;
        }
        
        // Compare health
        if (this.compareField('hp', current.hp, last.hp)) {
            delta.hp = current.hp;
            hasChanges = true;
        }
        
        if (this.compareField('maxHp', current.maxHp, last.maxHp)) {
            delta.maxHp = current.maxHp;
            hasChanges = true;
        }
        
        // Compare state
        if (current.state !== last.state) {
            delta.state = current.state;
            hasChanges = true;
        }
        
        // Compare combat info
        if (current.level !== last.level) {
            delta.level = current.level;
            hasChanges = true;
        }
        
        if (current.attack !== last.attack) {
            delta.attack = current.attack;
            hasChanges = true;
        }
        
        if (current.defense !== last.defense) {
            delta.defense = current.defense;
            hasChanges = true;
        }
        
        return hasChanges ? delta : null;
    }

    /**
     * Compare field values with threshold
     * @param {string} fieldName - Field name
     * @param {*} current - Current value
     * @param {*} last - Last value
     * @returns {boolean} - True if field changed significantly
     */
    compareField(fieldName, current, last) {
        if (current === undefined || last === undefined) {
            return current !== last;
        }
        
        const threshold = this.getFieldThreshold(fieldName);
        
        if (typeof current === 'number' && typeof last === 'number') {
            return Math.abs(current - last) > threshold;
        }
        
        return current !== last;
    }

    /**
     * Get threshold for field
     * @param {string} fieldName - Field name
     * @returns {number} - Threshold value
     */
    getFieldThreshold(fieldName) {
        switch (fieldName) {
            case 'x':
            case 'y':
                return this.config.positionThreshold;
            case 'vx':
            case 'vy':
                return this.config.velocityThreshold;
            case 'hp':
            case 'maxHp':
                return this.config.healthThreshold;
            default:
                return 0;
        }
    }

    /**
     * Create full entity snapshot
     * @param {object} entity - Entity data
     * @returns {object} - Full entity snapshot
     */
    createFullEntity(entity) {
        const fullEntity = { ...entity };
        fullEntity.full = true; // Mark as full entity
        return fullEntity;
    }

    /**
     * Create full snapshot
     * @param {object} snapshot - Snapshot data
     * @returns {object} - Full snapshot
     */
    createFullSnapshot(snapshot) {
        const fullSnapshot = { ...snapshot };
        fullSnapshot.full = true; // Mark as full snapshot
        fullSnapshot.entities = snapshot.entities.map(e => this.createFullEntity(e));
        return fullSnapshot;
    }

    /**
     * Update field statistics
     * @param {object} current - Current entity
     * @param {object|null} last - Last entity or null
     */
    updateFieldStats(current, last) {
        const fields = ['x', 'y', 'vx', 'vy', 'hp', 'maxHp', 'state', 'level', 'attack', 'defense'];
        
        for (const field of fields) {
            if (current[field] !== undefined) {
                if (!last || this.compareField(field, current[field], last[field])) {
                    this.fieldStats[field].sent++;
                } else {
                    this.fieldStats[field].skipped++;
                }
            }
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
     * Update compression statistics
     * @param {object} delta - Delta snapshot
     * @param {object} full - Full snapshot
     * @param {number} compressionTime - Compression time
     */
    updateCompressionStats(delta, full, compressionTime) {
        this.stats.totalCompressions++;
        
        const deltaSize = this.getSnapshotSize(delta);
        const fullSize = this.getSnapshotSize(full);
        
        const compressionRatio = deltaSize / fullSize;
        this.stats.averageCompressionRatio = 
            (this.stats.averageCompressionRatio * (this.stats.totalCompressions - 1) + compressionRatio) / 
            this.stats.totalCompressions;
        
        this.stats.bandwidthSaved += (fullSize - deltaSize);
        this.stats.averageDeltaSize = 
            (this.stats.averageDeltaSize * (this.stats.totalCompressions - 1) + deltaSize) / 
            this.stats.totalCompressions;
    }

    /**
     * Decompress delta on client side
     * @param {object} delta - Delta snapshot
     * @param {object} lastSnapshot - Last full snapshot
     * @returns {object} - Reconstructed full snapshot
     */
    decompressDelta(delta, lastSnapshot) {
        if (!delta.delta) {
            return delta; // Full snapshot
        }
        
        // Start with last snapshot
        const reconstructed = {
            ...lastSnapshot,
            tick: delta.tick,
            timestamp: delta.timestamp,
            entities: []
        };
        
        // Track current entity IDs
        const currentEntityIds = new Set();
        
        // Update existing entities
        for (const deltaEntity of delta.entities) {
            currentEntityIds.add(deltaEntity.id);
            
            // Find entity in last snapshot
            const lastEntity = lastSnapshot.entities.find(e => e.id === deltaEntity.id);
            
            if (deltaEntity.full) {
                // Full entity data
                reconstructed.entities.push(deltaEntity);
            } else if (lastEntity) {
                // Merge delta into last entity
                const mergedEntity = { ...lastEntity, ...deltaEntity };
                reconstructed.entities.push(mergedEntity);
            } else {
                // New entity not in last snapshot
                reconstructed.entities.push(deltaEntity);
            }
        }
        
        // Remove entities that are no longer visible
        for (const lastEntity of lastSnapshot.entities) {
            if (!currentEntityIds.has(lastEntity.id) && 
                !delta.removedEntities.includes(lastEntity.id)) {
                // Entity still exists but not in delta, keep it
                reconstructed.entities.push(lastEntity);
            }
        }
        
        return reconstructed;
    }

    /**
     * Clear player state
     * @param {number} playerId - Player ID
     */
    clearPlayerState(playerId) {
        this.lastSnapshots.delete(playerId);
        this.removedEntities.delete(playerId);
    }

    /**
     * Get compression statistics
     * @returns {object} - Compression stats
     */
    getStats() {
        return {
            ...this.stats,
            fieldStats: { ...this.fieldStats },
            trackedPlayers: this.lastSnapshots.size,
            compressionEnabled: this.config.enabled
        };
    }

    /**
     * Get field efficiency statistics
     * @returns {object} - Field efficiency stats
     */
    getFieldEfficiency() {
        const efficiency = {};
        
        for (const [field, stats] of Object.entries(this.fieldStats)) {
            const total = stats.sent + stats.skipped;
            efficiency[field] = {
                sent: stats.sent,
                skipped: stats.skipped,
                efficiency: total > 0 ? (stats.skipped / total) * 100 : 0
            };
        }
        
        return efficiency;
    }

    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            totalCompressions: 0,
            averageCompressionRatio: 0,
            bandwidthSaved: 0,
            averageDeltaSize: 0,
            fieldsCompressed: {}
        };
        
        for (const field of Object.keys(this.fieldStats)) {
            this.fieldStats[field] = { sent: 0, skipped: 0 };
        }
    }

    /**
     * Update configuration
     * @param {object} newConfig - New configuration
     */
    updateConfig(newConfig) {
        Object.assign(this.config, newConfig);
        console.log('🗜️ Delta compressor configuration updated:', newConfig);
    }

    /**
     * Debug visualization
     * @returns {object} - Debug information
     */
    debugVisualization() {
        return {
            config: this.config,
            stats: this.getStats(),
            fieldEfficiency: this.getFieldEfficiency(),
            trackedPlayers: this.lastSnapshots.size,
            removedEntities: Array.from(this.removedEntities.entries()).map(([playerId, entities]) => ({
                playerId,
                count: entities.size
            }))
        };
    }
}

module.exports = DeltaCompressor;
