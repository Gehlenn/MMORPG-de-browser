/**
 * SpatialIndex - Quadtree for efficient spatial queries
 * Optimizes entity lookup and viewport culling
 */

class SpatialIndex {
    constructor(bounds, maxObjects = 10, maxLevels = 4, level = 0) {
        this.bounds = bounds; // { x, y, width, height }
        this.maxObjects = maxObjects;
        this.maxLevels = maxLevels;
        this.level = level;
        
        this.objects = [];
        this.nodes = []; // Child quadrants
        
        // Statistics
        this.stats = {
            insertions: 0,
            removals: 0,
            queries: 0,
            splits: 0
        };
    }
    
    /**
     * Split node into 4 quadrants
     */
    split() {
        const subWidth = this.bounds.width / 2;
        const subHeight = this.bounds.height / 2;
        const x = this.bounds.x;
        const y = this.bounds.y;
        
        this.nodes = [
            // Top-right
            new SpatialIndex(
                { x: x + subWidth, y: y, width: subWidth, height: subHeight },
                this.maxObjects, this.maxLevels, this.level + 1
            ),
            // Top-left
            new SpatialIndex(
                { x: x, y: y, width: subWidth, height: subHeight },
                this.maxObjects, this.maxLevels, this.level + 1
            ),
            // Bottom-left
            new SpatialIndex(
                { x: x, y: y + subHeight, width: subWidth, height: subHeight },
                this.maxObjects, this.maxLevels, this.level + 1
            ),
            // Bottom-right
            new SpatialIndex(
                { x: x + subWidth, y: y + subHeight, width: subWidth, height: subHeight },
                this.maxObjects, this.maxLevels, this.level + 1
            )
        ];
        
        this.stats.splits++;
    }
    
    /**
     * Determine which quadrant an object belongs to
     * @returns {number} Index (0-3) or -1 if spans multiple
     */
    getIndex(obj) {
        const index = -1;
        const verticalMidpoint = this.bounds.x + this.bounds.width / 2;
        const horizontalMidpoint = this.bounds.y + this.bounds.height / 2;
        
        const top = obj.y < horizontalMidpoint;
        const bottom = obj.y + (obj.height || 0) > horizontalMidpoint;
        const left = obj.x < verticalMidpoint;
        const right = obj.x + (obj.width || 0) > verticalMidpoint;
        
        // Object spans multiple quadrants
        if ((top && bottom) || (left && right)) {
            return -1;
        }
        
        if (top) {
            return right ? 0 : 1; // Top-right : Top-left
        } else {
            return right ? 3 : 2; // Bottom-right : Bottom-left
        }
    }
    
    /**
     * Insert object into index
     * @param {Object} obj - Entity with x, y, width, height
     */
    insert(obj) {
        this.stats.insertions++;
        
        // If has subnodes, insert into appropriate child
        if (this.nodes.length > 0) {
            const index = this.getIndex(obj);
            
            if (index !== -1) {
                this.nodes[index].insert(obj);
                return;
            }
        }
        
        // Add to this node
        this.objects.push(obj);
        
        // Split if necessary
        if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
            if (this.nodes.length === 0) {
                this.split();
            }
            
            // Redistribute objects
            for (let i = this.objects.length - 1; i >= 0; i--) {
                const index = this.getIndex(this.objects[i]);
                if (index !== -1) {
                    this.nodes[index].insert(this.objects.splice(i, 1)[0]);
                }
            }
        }
    }
    
    /**
     * Remove object from index
     * @param {Object} obj 
     */
    remove(obj) {
        this.stats.removals++;
        
        // Check this node
        const idx = this.objects.indexOf(obj);
        if (idx !== -1) {
            this.objects.splice(idx, 1);
            return true;
        }
        
        // Check child nodes
        if (this.nodes.length > 0) {
            const index = this.getIndex(obj);
            if (index !== -1) {
                return this.nodes[index].remove(obj);
            }
            
            // Check all children if spans multiple
            for (const node of this.nodes) {
                if (node.remove(obj)) return true;
            }
        }
        
        return false;
    }
    
    /**
     * Update object position (remove + reinsert)
     * @param {Object} obj 
     * @param {Object} newPosition - { x, y }
     */
    update(obj, newPosition) {
        this.remove(obj);
        obj.x = newPosition.x;
        obj.y = newPosition.y;
        this.insert(obj);
    }
    
    /**
     * Query objects in range
     * @param {Object} range - { x, y, width, height }
     * @returns {Array} Objects in range
     */
    query(range, found = []) {
        this.stats.queries++;
        
        // Check if range intersects this node
        if (!this.intersects(range, this.bounds)) {
            return found;
        }
        
        // Check objects in this node
        for (const obj of this.objects) {
            if (this.intersects(range, obj)) {
                found.push(obj);
            }
        }
        
        // Check child nodes
        if (this.nodes.length > 0) {
            for (const node of this.nodes) {
                node.query(range, found);
            }
        }
        
        return found;
    }
    
    /**
     * Check if two rectangles intersect
     */
    intersects(a, b) {
        return !(
            a.x + a.width < b.x ||
            b.x + (b.width || 0) < a.x ||
            a.y + a.height < b.y ||
            b.y + (b.height || 0) < a.y
        );
    }
    
    /**
     * Get all objects (for debugging)
     */
    getAllObjects(found = []) {
        found.push(...this.objects);
        
        for (const node of this.nodes) {
            node.getAllObjects(found);
        }
        
        return found;
    }
    
    /**
     * Clear all objects
     */
    clear() {
        this.objects = [];
        
        for (const node of this.nodes) {
            node.clear();
        }
        
        this.nodes = [];
    }
    
    /**
     * Get statistics
     */
    getStats() {
        return {
            ...this.stats,
            objectCount: this.getAllObjects().length,
            nodeCount: this.countNodes()
        };
    }
    
    /**
     * Count total nodes
     */
    countNodes() {
        let count = 1;
        for (const node of this.nodes) {
            count += node.countNodes();
        }
        return count;
    }
}

export default SpatialIndex;
