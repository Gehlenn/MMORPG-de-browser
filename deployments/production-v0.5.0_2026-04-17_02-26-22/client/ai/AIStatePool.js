/**
 * AIStatePool - Object pool for AI state objects
 * Reduces garbage collection by reusing objects
 */

class AIStatePool {
    constructor(initialSize = 50) {
        this.available = [];
        this.inUse = new Set();
        this.initialSize = initialSize;
        
        // Statistics
        this.stats = {
            acquired: 0,
            released: 0,
            expanded: 0,
            created: 0
        };
        
        // Pre-populate pool
        this.expand(initialSize);
    }
    
    /**
     * Expand pool with new objects
     * @param {number} count 
     */
    expand(count) {
        for (let i = 0; i < count; i++) {
            this.available.push(this.createObject());
        }
        this.stats.created += count;
        this.stats.expanded++;
        console.log(`[AIStatePool] Expanded by ${count} (total: ${this.available.length})`);
    }
    
    /**
     * Create a new AI state object
     * @returns {Object}
     */
    createObject() {
        return {
            mobId: null,
            state: 'idle',
            previousState: null,
            targetId: null,
            intent: null,
            confidence: 0.5,
            position: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
            lastUpdate: 0,
            updateFrequency: 1,
            distance: 0,
            visible: true,
            priority: 0
        };
    }
    
    /**
     * Acquire object from pool
     * @returns {Object}
     */
    acquire() {
        // Expand if needed
        if (this.available.length === 0) {
            this.expand(Math.max(10, Math.floor(this.initialSize * 0.2)));
        }
        
        const obj = this.available.pop();
        this.inUse.add(obj);
        this.stats.acquired++;
        
        return obj;
    }
    
    /**
     * Return object to pool
     * @param {Object} obj 
     */
    release(obj) {
        if (!this.inUse.has(obj)) {
            console.warn('[AIStatePool] Attempted to release object not in use');
            return;
        }
        
        // Reset object state
        this.reset(obj);
        
        this.inUse.delete(obj);
        this.available.push(obj);
        this.stats.released++;
    }
    
    /**
     * Reset object to default state
     * @param {Object} obj 
     */
    reset(obj) {
        obj.mobId = null;
        obj.state = 'idle';
        obj.previousState = null;
        obj.targetId = null;
        obj.intent = null;
        obj.confidence = 0.5;
        obj.position.x = 0;
        obj.position.y = 0;
        obj.velocity.x = 0;
        obj.velocity.y = 0;
        obj.lastUpdate = 0;
        obj.updateFrequency = 1;
        obj.distance = 0;
        obj.visible = true;
        obj.priority = 0;
    }
    
    /**
     * Get current pool statistics
     * @returns {Object}
     */
    getStats() {
        return {
            available: this.available.length,
            inUse: this.inUse.size,
            total: this.available.length + this.inUse.size,
            ...this.stats,
            utilizationRate: this.inUse.size / (this.available.length + this.inUse.size)
        };
    }
    
    /**
     * Release all objects
     */
    clear() {
        this.inUse.forEach(obj => {
            this.reset(obj);
            this.available.push(obj);
        });
        this.inUse.clear();
        this.stats.released += this.stats.acquired;
    }
    
    /**
     * Cleanup and destroy pool
     */
    destroy() {
        this.clear();
        this.available = [];
        this.stats = {
            acquired: 0,
            released: 0,
            expanded: 0,
            created: 0
        };
    }
}

export default AIStatePool;
