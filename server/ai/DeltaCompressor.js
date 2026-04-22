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
            totalCompressed: 0,
            totalSavings: 0,
            fullSends: 0,
            deltaSends: 0
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
        if (currentState === null || currentState === undefined) {
            return currentState;
        }
        
        const lastState = this.lastStates.get(entityId);
        
        // First send - must be full state
        if (!lastState) {
            this.lastStates.set(entityId, this.cloneState(currentState));
            this.stats.totalCompressed = (this.stats.totalCompressed || 0) + 1;
            this.stats.fullSends = (this.stats.fullSends || 0) + 1;
            return currentState;
        }
        
        // Build delta
        const delta = this.buildDelta(lastState, currentState);
        
        // If nothing changed, return empty object
        if (delta === null) {
            this.stats.totalCompressed = (this.stats.totalCompressed || 0) + 1;
            return {};
        }
        
        // Send delta
        this.lastStates.set(entityId, this.cloneState(currentState));
        this.stats.deltaSends = (this.stats.deltaSends || 0) + 1;
        this.stats.totalCompressed = (this.stats.totalCompressed || 0) + 1;
        
        return delta;
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
        
        // Get all unique keys from both objects
        const allKeys = new Set([
            ...Object.keys(last || {}),
            ...Object.keys(current || {})
        ]);
        
        for (const field of allKeys) {
            const lastVal = last?.[field];
            const currentVal = current?.[field];
            
            // Deep compare for objects and arrays
            if (typeof currentVal === 'object' && currentVal !== null) {
                if (!this.deepEqual(lastVal, currentVal)) {
                    delta[field] = currentVal;
                    hasChanges = true;
                }
            } else if (field === 'x' || field === 'y') {
                // Quantize position to reduce data size
                const currentQuantized = Math.round(currentVal || 0);
                const lastQuantized = Math.round(lastVal || 0);
                
                if (currentQuantized !== lastQuantized) {
                    delta[field] = currentQuantized;
                    hasChanges = true;
                }
            } else {
                // Simple comparison for primitives
                if (lastVal !== currentVal) {
                    delta[field] = currentVal;
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
    calculateSavings(fullSize, deltaSize) {
        if (typeof fullSize !== 'number' || typeof deltaSize !== 'number') {
            return 0;
        }
        
        const savings = fullSize - deltaSize;
        this.stats.totalSavings = (this.stats.totalSavings || 0) + savings;
        
        return Math.max(0, (savings / fullSize) * 100);
    }
    
    /**
     * Decompress delta on client
     * @param {string} entityId
     * @param {Object} delta
     * @param {Object} clientState 
     * @returns {Object} Full state
     */
    decompress(entityId, delta, clientState) {
        if (!delta || Object.keys(delta).length === 0) {
            return clientState;
        }
        
        return {
            ...clientState,
            ...delta
        };
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
        return {
            totalCompressed: this.stats.totalCompressed || 0,
            totalSavings: this.stats.totalSavings || 0,
            fullSends: this.stats.fullSends || 0,
            deltaSends: this.stats.deltaSends || 0
        };
    }
    
    /**
     * Clear all tracked states
     */
    clear() {
        this.lastStates.clear();
        this.stats = {
            totalCompressed: 0,
            totalSavings: 0,
            fullSends: 0,
            deltaSends: 0
        };
    }
}

module.exports = DeltaCompressor;
