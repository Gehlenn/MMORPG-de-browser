/**
 * Entity Manager
 * Manages all game entities (players, monsters, NPCs, items, etc.)
 */

import { Entity } from '../entities/Entity.js';
import { Player } from '../entities/Player.js';
import { Monster } from '../entities/Monster.js';
import { NPC } from '../entities/NPC.js';
import { Item } from '../entities/Item.js';

class EntityManager {
    constructor() {
        this.entities = new Map();
        this.entitiesByType = new Map();
        this.entitiesByPosition = new Map();
        this.nextId = 1;
        
        // Spatial indexing for performance
        this.spatialGrid = {};
        this.gridSize = 32; // Same as tile size
        
        // Entity pools for optimization
        this.pools = {
            monster: [],
            npc: [],
            item: [],
            effect: []
        };
        
        // Update lists
        this.toAdd = [];
        this.toRemove = [];
        
        // Performance tracking
        this.updateCount = 0;
        this.renderCount = 0;
    }
    
    generateId() {
        return `entity_${this.nextId++}`;
    }
    
    addEntity(entity) {
        if (!entity || !entity.id) {
            console.warn('Invalid entity provided to addEntity');
            return null;
        }
        
        // Add to main collection
        this.entities.set(entity.id, entity);
        
        // Add to type collection
        if (!this.entitiesByType.has(entity.type)) {
            this.entitiesByType.set(entity.type, new Set());
        }
        this.entitiesByType.get(entity.type).add(entity.id);
        
        // Add to spatial index
        this.updateSpatialIndex(entity);
        
        // Set entity manager reference
        entity.entityManager = this;
        
        return entity;
    }
    
    removeEntity(entityId) {
        const entity = this.entities.get(entityId);
        if (!entity) return false;
        
        // Remove from main collection
        this.entities.delete(entityId);
        
        // Remove from type collection
        const typeSet = this.entitiesByType.get(entity.type);
        if (typeSet) {
            typeSet.delete(entityId);
        }
        
        // Remove from spatial index
        this.removeFromSpatialIndex(entity);
        
        // Return to pool if applicable
        this.returnToPool(entity);
        
        // Cleanup entity
        if (entity.cleanup) {
            entity.cleanup();
        }
        
        return true;
    }
    
    getEntity(entityId) {
        return this.entities.get(entityId);
    }
    
    getEntitiesByType(type) {
        const typeSet = this.entitiesByType.get(type);
        if (!typeSet) return [];
        
        return Array.from(typeSet).map(id => this.entities.get(id)).filter(Boolean);
    }
    
    getEntitiesAt(x, y) {
        const positionKey = this.getPositionKey(x, y);
        return this.entitiesByPosition.get(positionKey) || [];
    }
    
    getEntitiesInRange(x, y, range) {
        const entities = [];
        const minX = Math.floor(x - range);
        const maxX = Math.ceil(x + range);
        const minY = Math.floor(y - range);
        const maxY = Math.ceil(y + range);
        
        for (let px = minX; px <= maxX; px++) {
            for (let py = minY; py <= maxY; py++) {
                const entitiesAtPos = this.getEntitiesAt(px, py);
                for (const entity of entitiesAtPos) {
                    const distance = Math.sqrt(
                        Math.pow(entity.x - x, 2) + Math.pow(entity.y - y, 2)
                    );
                    if (distance <= range) {
                        entities.push(entity);
                    }
                }
            }
        }
        
        return entities;
    }
    
    getEntitiesInArea(x, y, width, height) {
        const entities = [];
        const minX = Math.floor(x);
        const maxX = Math.ceil(x + width);
        const minY = Math.floor(y);
        const maxY = Math.ceil(y + height);
        
        for (let px = minX; px <= maxX; px++) {
            for (let py = minY; py <= maxY; py++) {
                const entitiesAtPos = this.getEntitiesAt(px, py);
                entities.push(...entitiesAtPos);
            }
        }
        
        return entities;
    }
    
    findNearest(x, y, type, maxDistance = Infinity) {
        const entities = this.getEntitiesByType(type);
        let nearest = null;
        let nearestDistance = maxDistance;
        
        for (const entity of entities) {
            const distance = Math.sqrt(
                Math.pow(entity.x - x, 2) + Math.pow(entity.y - y, 2)
            );
            if (distance < nearestDistance) {
                nearest = entity;
                nearestDistance = distance;
            }
        }
        
        return nearest;
    }
    
    createEntity(type, config = {}) {
        let entity;
        
        switch (type) {
            case 'player':
                entity = new Player(config);
                break;
            case 'monster':
                entity = this.getFromPool('monster', Monster, config);
                break;
            case 'npc':
                entity = this.getFromPool('npc', NPC, config);
                break;
            case 'item':
                entity = this.getFromPool('item', Item, config);
                break;
            default:
                entity = new Entity({ type, ...config });
        }
        
        if (!entity.id) {
            entity.id = this.generateId();
        }
        
        return this.addEntity(entity);
    }
    
    getFromPool(poolType, EntityClass, config) {
        const pool = this.pools[poolType];
        if (pool && pool.length > 0) {
            const entity = pool.pop();
            entity.reset(config);
            return entity;
        }
        return new EntityClass(config);
    }
    
    returnToPool(entity) {
        const poolType = entity.type;
        const pool = this.pools[poolType];
        
        if (pool && pool.length < 50) { // Limit pool size
            entity.reset();
            pool.push(entity);
        }
    }
    
    updateSpatialIndex(entity) {
        // Remove from old position
        this.removeFromSpatialIndex(entity);
        
        // Add to new position
        const positionKey = this.getPositionKey(entity.x, entity.y);
        if (!this.entitiesByPosition.has(positionKey)) {
            this.entitiesByPosition.set(positionKey, []);
        }
        this.entitiesByPosition.get(positionKey).push(entity);
        
        // Store last position for removal
        entity.lastPositionKey = positionKey;
    }
    
    removeFromSpatialIndex(entity) {
        if (entity.lastPositionKey) {
            const entities = this.entitiesByPosition.get(entity.lastPositionKey);
            if (entities) {
                const index = entities.indexOf(entity);
                if (index > -1) {
                    entities.splice(index, 1);
                }
                
                // Clean up empty position entries
                if (entities.length === 0) {
                    this.entitiesByPosition.delete(entity.lastPositionKey);
                }
            }
        }
    }
    
    getPositionKey(x, y) {
        return `${Math.floor(x)},${Math.floor(y)}`;
    }
    
    update(deltaTime) {
        this.updateCount = 0;
        
        // Process pending additions
        for (const entity of this.toAdd) {
            this.addEntity(entity);
        }
        this.toAdd.length = 0;
        
        // Process pending removals
        for (const entityId of this.toRemove) {
            this.removeEntity(entityId);
        }
        this.toRemove.length = 0;
        
        // Update all entities
        for (const entity of this.entities.values()) {
            if (entity.update && entity.active !== false) {
                entity.update(deltaTime);
                this.updateCount++;
                
                // Update spatial index if position changed
                if (entity.x !== entity.lastX || entity.y !== entity.lastY) {
                    this.updateSpatialIndex(entity);
                    entity.lastX = entity.x;
                    entity.lastY = entity.y;
                }
            }
        }
    }
    
    render(renderer) {
        this.renderCount = 0;
        
        // Get visible bounds from camera
        const bounds = renderer.camera?.getVisibleBounds();
        if (!bounds) {
            // Render all entities if no camera
            for (const entity of this.entities.values()) {
                if (entity.render && entity.visible !== false) {
                    entity.render(renderer);
                    this.renderCount++;
                }
            }
            return;
        }
        
        // Render only visible entities
        const minX = Math.floor(bounds.left / 32);
        const maxX = Math.ceil(bounds.right / 32);
        const minY = Math.floor(bounds.top / 32);
        const maxY = Math.ceil(bounds.bottom / 32);
        
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const entities = this.getEntitiesAt(x, y);
                for (const entity of entities) {
                    if (entity.render && entity.visible !== false) {
                        entity.render(renderer);
                        this.renderCount++;
                    }
                }
            }
        }
    }
    
    // Batch operations
    addEntities(entities) {
        for (const entity of entities) {
            this.toAdd.push(entity);
        }
    }
    
    removeEntities(entityIds) {
        for (const entityId of entityIds) {
            this.toRemove.push(entityId);
        }
    }
    
    clearEntities() {
        for (const entityId of this.entities.keys()) {
            this.toRemove.push(entityId);
        }
    }
    
    clearEntitiesByType(type) {
        const entities = this.getEntitiesByType(type);
        for (const entity of entities) {
            this.toRemove.push(entity.id);
        }
    }
    
    // Entity queries
    query(filter) {
        const results = [];
        
        for (const entity of this.entities.values()) {
            if (filter(entity)) {
                results.push(entity);
            }
        }
        
        return results;
    }
    
    queryInArea(x, y, width, height, filter) {
        const entities = this.getEntitiesInArea(x, y, width, height);
        return filter ? entities.filter(filter) : entities;
    }
    
    queryInRange(x, y, range, filter) {
        const entities = this.getEntitiesInRange(x, y, range);
        return filter ? entities.filter(filter) : entities;
    }
    
    // Utility methods
    getEntityCount() {
        return this.entities.size;
    }
    
    getEntityCountByType(type) {
        const typeSet = this.entitiesByType.get(type);
        return typeSet ? typeSet.size : 0;
    }
    
    isEmpty() {
        return this.entities.size === 0;
    }
    
    // Performance optimization
    optimize() {
        // Clean up empty spatial grid entries
        for (const [key, entities] of this.entitiesByPosition.entries()) {
            if (entities.length === 0) {
                this.entitiesByPosition.delete(key);
            }
        }
        
        // Limit pool sizes
        for (const [poolType, pool] of Object.entries(this.pools)) {
            if (pool.length > 50) {
                pool.length = 50;
            }
        }
    }
    
    // Serialization
    serialize() {
        const data = {
            entities: [],
            nextId: this.nextId
        };
        
        for (const entity of this.entities.values()) {
            if (entity.serialize) {
                data.entities.push(entity.serialize());
            }
        }
        
        return data;
    }
    
    deserialize(data) {
        this.clearEntities();
        this.nextId = data.nextId || 1;
        
        for (const entityData of data.entities) {
            const entity = this.createEntity(entityData.type, entityData);
            if (entity.deserialize) {
                entity.deserialize(entityData);
            }
        }
    }
    
    // Debug methods
    getDebugInfo() {
        return {
            totalEntities: this.entities.size,
            entitiesByType: Object.fromEntries(
                Array.from(this.entitiesByType.entries()).map(([type, set]) => [type, set.size])
            ),
            spatialGridSize: this.entitiesByPosition.size,
            updateCount: this.updateCount,
            renderCount: this.renderCount,
            poolSizes: Object.fromEntries(
                Object.entries(this.pools).map(([type, pool]) => [type, pool.length])
            )
        };
    }
    
    logEntities() {
        console.log('=== Entity Manager Debug Info ===');
        console.log('Total entities:', this.entities.size);
        
        for (const [type, set] of this.entitiesByType.entries()) {
            console.log(`${type}:`, set.size);
        }
        
        console.log('Spatial grid entries:', this.entitiesByPosition.size);
        console.log('Pool sizes:', Object.fromEntries(
            Object.entries(this.pools).map(([type, pool]) => [type, pool.length])
        ));
    }
}

export default EntityManager;
