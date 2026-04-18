/**
 * Movement System
 * Handles movement for entities with PositionComponent and VelocityComponent
 */

class MovementSystem {
    constructor(entityManager, componentManager) {
        this.entityManager = entityManager;
        this.componentManager = componentManager;
        this.name = 'MovementSystem';
        
        // System configuration
        this.tileSize = 64; // Pixels per tile
        this.maxDeltaTime = 0.1; // Maximum delta time to prevent large jumps
        
        // Performance tracking
        this.processedEntities = 0;
        this.totalProcessingTime = 0;
    }

    /**
     * Update all entities with movement components
     * @param {number} deltaTime - Time since last update in milliseconds
     */
    update(deltaTime) {
        const startTime = performance.now();
        
        // Clamp delta time to prevent large jumps
        deltaTime = Math.min(deltaTime, this.maxDeltaTime * 1000);
        const deltaTimeSeconds = deltaTime / 1000;
        
        // Get all entities with both Position and Velocity components
        const positionEntities = this.componentManager.getAllWith('position');
        const velocityEntities = this.componentManager.getAllWith('velocity');
        
        this.processedEntities = 0;
        
        // Process each entity that has both components
        for (const entityId of positionEntities.keys()) {
            if (velocityEntities.has(entityId)) {
                this.processEntity(entityId, deltaTimeSeconds);
                this.processedEntities++;
            }
        }
        
        const endTime = performance.now();
        this.totalProcessingTime = endTime - startTime;
    }

    /**
     * Process movement for a single entity
     * @param {number} entityId - Entity ID
     * @param {number} deltaTime - Time delta in seconds
     */
    processEntity(entityId, deltaTime) {
        const position = this.componentManager.get(entityId, 'position');
        const velocity = this.componentManager.get(entityId, 'velocity');
        
        if (!position || !velocity) return;
        
        // Apply friction to velocity
        velocity.applyFriction(deltaTime);
        
        // Limit to max speed
        velocity.limitToMaxSpeed();
        
        // Calculate new position
        const newX = position.x + velocity.vx * deltaTime;
        const newY = position.y + velocity.vy * deltaTime;
        
        // Update position (you might want to add collision detection here)
        position.set(newX, newY);
        
        // Update movement state
        velocity.isMoving = (velocity.vx !== 0 || velocity.vy !== 0);
    }

    /**
     * Set entity velocity
     * @param {number} entityId - Entity ID
     * @param {number} vx - X velocity
     * @param {number} vy - Y velocity
     * @returns {boolean} - True if velocity was set
     */
    setEntityVelocity(entityId, vx, vy) {
        const velocity = this.componentManager.get(entityId, 'velocity');
        if (!velocity) return false;
        
        velocity.set(vx, vy);
        return true;
    }

    /**
     * Add force to entity
     * @param {number} entityId - Entity ID
     * @param {number} fx - Force X
     * @param {number} fy - Force Y
     * @param {number} mass - Entity mass
     * @returns {boolean} - True if force was applied
     */
    applyForce(entityId, fx, fy, mass = 1) {
        const velocity = this.componentManager.get(entityId, 'velocity');
        if (!velocity) return false;
        
        velocity.applyForce(fx, fy, mass);
        return true;
    }

    /**
     * Move entity towards target position
     * @param {number} entityId - Entity ID
     * @param {number} targetX - Target X position
     * @param {number} targetY - Target Y position
     * @param {number} speed - Movement speed
     * @param {number} deltaTime - Time delta in seconds
     * @returns {boolean} - True if movement was applied
     */
    moveTowards(entityId, targetX, targetY, speed, deltaTime) {
        const position = this.componentManager.get(entityId, 'position');
        const velocity = this.componentManager.get(entityId, 'velocity');
        
        if (!position || !velocity) return false;
        
        // Calculate direction to target
        const dx = targetX - position.x;
        const dy = targetY - position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 0.1) {
            // Already at target
            velocity.stop();
            return true;
        }
        
        // Calculate velocity towards target
        const vx = (dx / distance) * speed;
        const vy = (dy / distance) * speed;
        
        // Apply acceleration towards target velocity
        velocity.applyAcceleration(vx, vy, deltaTime);
        
        return true;
    }

    /**
     * Stop entity movement
     * @param {number} entityId - Entity ID
     * @returns {boolean} - True if entity was stopped
     */
    stopEntity(entityId) {
        const velocity = this.componentManager.get(entityId, 'velocity');
        if (!velocity) return false;
        
        velocity.stop();
        return true;
    }

    /**
     * Get entities in area
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {number} radius - Search radius
     * @returns {number[]} - Array of entity IDs in area
     */
    getEntitiesInArea(x, y, radius) {
        const entities = [];
        const positionEntities = this.componentManager.getAllWith('position');
        
        for (const [entityId, position] of positionEntities) {
            const distance = Math.sqrt(
                Math.pow(position.x - x, 2) + 
                Math.pow(position.y - y, 2)
            );
            
            if (distance <= radius) {
                entities.push(entityId);
            }
        }
        
        return entities;
    }

    /**
     * Get moving entities
     * @returns {number[]} - Array of moving entity IDs
     */
    getMovingEntities() {
        const movingEntities = [];
        const velocityEntities = this.componentManager.getAllWith('velocity');
        
        for (const [entityId, velocity] of velocityEntities) {
            if (velocity.isMoving) {
                movingEntities.push(entityId);
            }
        }
        
        return movingEntities;
    }

    /**
     * Get system statistics
     * @returns {object} - System statistics
     */
    getStats() {
        return {
            processedEntities: this.processedEntities,
            totalProcessingTime: this.totalProcessingTime,
            averageProcessingTime: this.processedEntities > 0 ? 
                this.totalProcessingTime / this.processedEntities : 0
        };
    }

    /**
     * Reset statistics
     */
    resetStats() {
        this.processedEntities = 0;
        this.totalProcessingTime = 0;
    }
}

module.exports = MovementSystem;
