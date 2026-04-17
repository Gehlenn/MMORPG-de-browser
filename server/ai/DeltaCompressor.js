/**
 * DeltaCompressor - Compresses AI state updates by sending only changed fields
 * Reduces network bandwidth significantly
 */

class DeltaCompressor {
    constructor() {
        // Store last sent state per entity
        this.lastStates = new Map();
        
        // Statistics
        this.stats = {
            fullSends: 0,
            deltaSends: 0,
            bytesSaved: 0,
            compressionRatio: 0
        };
        
        // Fields to track for delta compression
        this.trackedFields = [
            'x', 'y', 'state', 'targetId', 'confidence', 
            'intent', 'velocity', 'hp', 'maxHp'
        ];
    }
    
    /**
     * Compress state update
     * @param {string} entityId 
     * @param {Object} currentState 
     * @returns {Object} Compressed state (delta or full)
     */
    compress(entityId, currentState) {
        const lastState = this.lastStates.get(entityId);
        
        // First send - must be full state
        if (!lastState) {
            this.lastStates.set(entityId, this.cloneState(currentState));
            this.stats.fullSends++;
            return {
                type: 'full',
                data: currentState
            };
        }
        
        // Build delta
        const delta = this.buildDelta(lastState, currentState);
        
        // If nothing changed, send null to skip
        if (delta === null) {
            return { type: 'skip' };
        }
        
        // If too many fields changed, send full state
        const deltaKeys = Object.keys(delta);
        if (deltaKeys.length > this.trackedFields.length * 0.6) {
            this.lastStates.set(entityId, this.cloneState(currentState));
            this.stats.fullSends++;
            return {
                type: 'full',
                data: currentState
            };
        }
        
        // Send delta
        this.lastStates.set(entityId, this.cloneState(currentState));
        this.stats.deltaSends++;
        this.calculateSavings(currentState, delta);
        
        return {
            type: 'delta',
            data: delta,
            timestamp: Date.now()
        };
    }
    
    /**
     * Build delta object with only changed fields
     * @param {Object} last 
     * @param {Object} current 
     * @returns {Object|null} Delta or null if no changes
     */
    buildDelta(last, current) {
        const delta = {};
        let hasChanges = false;
        
        for (const field of this.trackedFields) {
            if (field === 'intent' || field === 'velocity') {
                // Deep compare for objects
                if (!this.deepEqual(last[field], current[field])) {
                    delta[field] = current[field];
                    hasChanges = true;
                }
            } else if (field === 'x' || field === 'y') {
                // Quantize position to reduce data size
                const currentQuantized = Math.round(current[field]);
                const lastQuantized = Math.round(last[field] || 0);
                
                if (currentQuantized !== lastQuantized) {
                    delta[field] = currentQuantized;
                    hasChanges = true;
                }
            } else {
                // Simple comparison for primitives
                if (last[field] !== current[field]) {
                    delta[field] = current[field];
                    hasChanges = true;
                }
            }
        }
        
        return hasChanges ? delta : null;
    }
    
    /**
     * Deep equality check for objects
     */
    deepEqual(a, b) {
        if (a === b) return true;
        if (!a || !b) return false;
        
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        
        if (keysA.length !== keysB.length) return false;
        
        for (const key of keysA) {
            if (typeof a[key] === 'object' && a[key] !== null) {
                if (!this.deepEqual(a[key], b[key])) return false;
            } else if (a[key] !== b[key]) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Clone state object
     */
    cloneState(state) {
        return JSON.parse(JSON.stringify(state));
    }
    
    /**
     * Calculate bytes saved by delta compression
     */
    calculateSavings(fullState, delta) {
        const fullSize = JSON.stringify(fullState).length;
        const deltaSize = JSON.stringify(delta).length;
        const savings = fullSize - deltaSize;
        
        this.stats.bytesSaved += savings;
        this.stats.compressionRatio = this.stats.bytesSaved / 
            (this.stats.deltaSends + this.stats.fullSends || 1);
    }
    
    /**
     * Decompress delta on client
     * @param {Object} compressed 
     * @param {Object} currentClientState 
     * @returns {Object} Full state
     */
    decompress(compressed, currentClientState) {
        if (compressed.type === 'full') {
            return compressed.data;
        }
        
        if (compressed.type === 'delta') {
            return {
                ...currentClientState,
                ...compressed.data,
                _deltaTimestamp: compressed.timestamp
            };
        }
        
        return currentClientState;
    }
    
    /**
     * Remove entity from tracking (e.g., when despawned)
     * @param {string} entityId 
     */
    removeEntity(entityId) {
        this.lastStates.delete(entityId);
    }
    
    /**
     * Get compression statistics
     * @returns {Object}
     */
    getStats() {
        const total = this.stats.deltaSends + this.stats.fullSends;
        return {
            ...this.stats,
            totalSends: total,
            deltaRatio: total > 0 ? (this.stats.deltaSends / total * 100).toFixed(1) + '%' : '0%',
            avgSavingsPerDelta: this.stats.deltaSends > 0 ? 
                (this.stats.bytesSaved / this.stats.deltaSends).toFixed(0) : 0
        };
    }
    
    /**
     * Clear all tracked states
     */
    clear() {
        this.lastStates.clear();
        this.stats = {
            fullSends: 0,
            deltaSends: 0,
            bytesSaved: 0,
            compressionRatio: 0
        };
    }
}

export default DeltaCompressor;
