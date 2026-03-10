/**
 * Simple Entity Manager
 * Basic entity management without complex dependencies
 */

class SimpleEntityManager {
    constructor() {
        this.entities = new Map();
        this.nextId = 1;
        console.log('👾 Simple Entity Manager initialized');
    }
    
    add(entity) {
        if (!entity.id) {
            entity.id = this.nextId++;
        }
        this.entities.set(entity.id, entity);
        return entity.id;
    }
    
    remove(entityId) {
        return this.entities.delete(entityId);
    }
    
    getById(entityId) {
        return this.entities.get(entityId);
    }
    
    getAllEntities() {
        return Array.from(this.entities.values());
    }
    
    update(deltaTime) {
        // Update all entities
        for (const entity of this.entities.values()) {
            if (entity.update) {
                entity.update(deltaTime);
            }
        }
    }
    
    clear() {
        this.entities.clear();
        this.nextId = 1;
    }
}

// Export for use in main game
window.SimpleEntityManager = SimpleEntityManager;
