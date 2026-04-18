/**
 * Entity Manager
 * Central entity management for ECS architecture
 * Handles creation, removal, and tracking of all entities
 */

class EntityManager {
    constructor() {
        // Use Set for O(1) performance
        this.entities = new Set();
        this.nextId = 1;
        this.removedEntities = new Set();
        
        // Performance tracking
        this.stats = {
            totalCreated: 0,
            totalRemoved: 0,
            activeCount: 0
        };
    }

    /**
     * Create a new entity
     * @returns {number} - Unique entity ID
     */
    create() {
        const id = this.nextId++;
        this.entities.add(id);
        this.stats.totalCreated++;
        this.stats.activeCount = this.entities.size;
        
        return id;
    }

    /**
     * Remove an entity
     * @param {number} entityId - Entity ID to remove
     * @returns {boolean} - True if entity was removed
     */
    remove(entityId) {
        if (this.entities.has(entityId)) {
            this.entities.delete(entityId);
            this.removedEntities.add(entityId);
            this.stats.totalRemoved++;
            this.stats.activeCount = this.entities.size;
            return true;
        }
        return false;
    }

    /**
     * Get all active entities
     * @returns {Set<number>} - Set of all entity IDs
     */
    getAll() {
        return this.entities;
    }

    /**
     * Check if entity exists
     * @param {number} entityId - Entity ID to check
     * @returns {boolean} - True if entity exists
     */
    has(entityId) {
        return this.entities.has(entityId);
    }

    /**
     * Get entity count
     * @returns {number} - Number of active entities
     */
    getCount() {
        return this.entities.size;
    }

    /**
     * Clear removed entities (call after systems update)
     */
    clearRemoved() {
        this.removedEntities.clear();
    }

    /**
     * Get performance statistics
     * @returns {object} - Performance stats
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Reset all entities (for testing/world reset)
     */
    reset() {
        this.entities.clear();
        this.removedEntities.clear();
        this.nextId = 1;
        this.stats = {
            totalCreated: 0,
            totalRemoved: 0,
            activeCount: 0
        };
    }
}

module.exports = EntityManager;
