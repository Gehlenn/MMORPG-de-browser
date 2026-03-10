/**
 * AI System
 * Handles AI behavior for entities
 * Currently implements simple random movement with structure for expansion
 */

class AISystem {
    constructor(entityManager, componentManager) {
        this.entityManager = entityManager;
        this.componentManager = componentManager;
        this.name = 'AISystem';
        
        // AI configuration
        this.aiUpdateInterval = 1000; // Update AI every 1 second
        this.lastUpdateTime = 0;
        
        // AI behavior types
        this.behaviors = new Map();
        this.initializeBehaviors();
        
        // Performance tracking
        this.processedEntities = 0;
        this.totalProcessingTime = 0;
        
        // AI state storage
        this.aiStates = new Map(); // entityId -> aiState
    }

    /**
     * Initialize AI behavior types
     */
    initializeBehaviors() {
        // Simple random movement behavior
        this.behaviors.set('random', {
            update: (entityId, deltaTime) => this.updateRandomMovement(entityId, deltaTime)
        });
        
        // Aggressive behavior (chase and attack)
        this.behaviors.set('aggressive', {
            update: (entityId, deltaTime) => this.updateAggressiveBehavior(entityId, deltaTime)
        });
        
        // Passive behavior (flee from threats)
        this.behaviors.set('passive', {
            update: (entityId, deltaTime) => this.updatePassiveBehavior(entityId, deltaTime)
        });
        
        // Patrol behavior (follow waypoints)
        this.behaviors.set('patrol', {
            update: (entityId, deltaTime) => this.updatePatrolBehavior(entityId, deltaTime)
        });
        
        // Stationary behavior (don't move)
        this.behaviors.set('stationary', {
            update: (entityId, deltaTime) => this.updateStationaryBehavior(entityId, deltaTime)
        });
    }

    /**
     * Update AI system
     * @param {number} deltaTime - Time since last update in milliseconds
     */
    update(deltaTime) {
        const startTime = performance.now();
        const currentTime = Date.now();
        
        // Update AI at specified interval
        if (currentTime - this.lastUpdateTime < this.aiUpdateInterval) {
            return;
        }
        
        this.processedEntities = 0;
        
        // Get all entities with AI components (assuming we add AIComponent later)
        // For now, process entities with Position and Velocity but no player control
        const positionEntities = this.componentManager.getAllWith('position');
        const velocityEntities = this.componentManager.getAllWith('velocity');
        
        for (const entityId of positionEntities.keys()) {
            if (velocityEntities.has(entityId)) {
                // Check if this is an AI entity (not player controlled)
                if (this.isAIEntity(entityId)) {
                    this.updateEntityAI(entityId, deltaTime);
                    this.processedEntities++;
                }
            }
        }
        
        this.lastUpdateTime = currentTime;
        
        const endTime = performance.now();
        this.totalProcessingTime = endTime - startTime;
    }

    /**
     * Check if entity is AI controlled
     * @param {number} entityId - Entity ID
     * @returns {boolean} - True if AI controlled
     */
    isAIEntity(entityId) {
        // For now, assume entities without specific player components are AI
        // This can be expanded with an AIComponent later
        const combat = this.componentManager.get(entityId, 'combat');
        const health = this.componentManager.get(entityId, 'health');
        
        // Simple heuristic: if it has combat and health but no player-specific data, it's AI
        return combat && health && !this.isPlayerEntity(entityId);
    }

    /**
     * Check if entity is player controlled
     * @param {number} entityId - Entity ID
     * @returns {boolean} - True if player controlled
     */
    isPlayerEntity(entityId) {
        // This would check for player-specific components or flags
        // For now, we'll use a simple naming convention or component check
        // This should be expanded with a proper PlayerComponent
        return false; // Assume all are AI for now
    }

    /**
     * Update AI for a single entity
     * @param {number} entityId - Entity ID
     * @param {number} deltaTime - Time delta in milliseconds
     */
    updateEntityAI(entityId, deltaTime) {
        // Get or create AI state
        let aiState = this.aiStates.get(entityId);
        if (!aiState) {
            aiState = this.createAIState(entityId);
            this.aiStates.set(entityId, aiState);
        }
        
        // Update AI state
        aiState.lastUpdate = Date.now();
        
        // Execute behavior based on type
        const behavior = this.behaviors.get(aiState.behaviorType);
        if (behavior) {
            behavior.update(entityId, deltaTime);
        }
    }

    /**
     * Create AI state for entity
     * @param {number} entityId - Entity ID
     * @returns {object} - AI state object
     */
    createAIState(entityId) {
        const combat = this.componentManager.get(entityId, 'combat');
        const level = combat ? combat.level : 1;
        
        // Determine behavior based on entity properties
        let behaviorType = 'random';
        
        // Higher level entities might be more aggressive
        if (level > 5) {
            behaviorType = 'aggressive';
        } else if (level < 3) {
            behaviorType = 'passive';
        }
        
        return {
            behaviorType,
            lastUpdate: Date.now(),
            state: 'idle', // idle, moving, attacking, fleeing
            target: null,
            homePosition: this.getEntityPosition(entityId),
            patrolWaypoints: [],
            currentWaypoint: 0,
            decisionTimer: 0,
            lastDecision: Date.now()
        };
    }

    /**
     * Get entity position
     * @param {number} entityId - Entity ID
     * @returns {object} - Position {x, y}
     */
    getEntityPosition(entityId) {
        const position = this.componentManager.get(entityId, 'position');
        return position ? { x: position.x, y: position.y } : { x: 0, y: 0 };
    }

    /**
     * Update random movement behavior
     * @param {number} entityId - Entity ID
     * @param {number} deltaTime - Time delta
     */
    updateRandomMovement(entityId, deltaTime) {
        const aiState = this.aiStates.get(entityId);
        const velocity = this.componentManager.get(entityId, 'velocity');
        
        if (!velocity || !aiState) return;
        
        // Make random movement decisions
        const now = Date.now();
        const decisionInterval = 2000; // Change direction every 2 seconds
        
        if (now - aiState.lastDecision > decisionInterval) {
            // Random direction
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.0 + Math.random() * 2.0; // Random speed between 1-3
            
            velocity.setDirectionSpeed(angle, speed);
            aiState.lastDecision = now;
            aiState.state = 'moving';
        }
    }

    /**
     * Update aggressive behavior
     * @param {number} entityId - Entity ID
     * @param {number} deltaTime - Time delta
     */
    updateAggressiveBehavior(entityId, deltaTime) {
        const aiState = this.aiStates.get(entityId);
        const velocity = this.componentManager.get(entityId, 'velocity');
        const position = this.componentManager.get(entityId, 'position');
        
        if (!velocity || !position || !aiState) return;
        
        // Look for nearby enemies
        const enemies = this.findNearbyEnemies(entityId, 5.0); // 5 tile range
        
        if (enemies.length > 0) {
            // Chase closest enemy
            const closestEnemy = this.findClosestEnemy(entityId, enemies);
            const enemyPos = this.getEntityPosition(closestEnemy);
            
            // Move towards enemy
            this.moveTowards(entityId, enemyPos.x, enemyPos.y, 2.0);
            aiState.state = 'chasing';
            aiState.target = closestEnemy;
        } else {
            // No enemies nearby, patrol or return home
            this.updatePatrolBehavior(entityId, deltaTime);
        }
    }

    /**
     * Update passive behavior
     * @param {number} entityId - Entity ID
     * @param {number} deltaTime - Time delta
     */
    updatePassiveBehavior(entityId, deltaTime) {
        const aiState = this.aiStates.get(entityId);
        const position = this.componentManager.get(entityId, 'position');
        
        if (!position || !aiState) return;
        
        // Check for nearby threats
        const threats = this.findNearbyEnemies(entityId, 3.0); // 3 tile detection range
        
        if (threats.length > 0) {
            // Flee from threats
            const threatPos = this.getEntityPosition(threats[0]);
            this.fleeFrom(entityId, threatPos.x, threatPos.y, 3.0);
            aiState.state = 'fleeing';
        } else {
            // Wander peacefully
            this.updateRandomMovement(entityId, deltaTime);
        }
    }

    /**
     * Update patrol behavior
     * @param {number} entityId - Entity ID
     * @param {number} deltaTime - Time delta
     */
    updatePatrolBehavior(entityId, deltaTime) {
        const aiState = this.aiStates.get(entityId);
        const position = this.componentManager.get(entityId, 'position');
        
        if (!position || !aiState) return;
        
        // Initialize waypoints if empty
        if (aiState.patrolWaypoints.length === 0) {
            aiState.patrolWaypoints = this.generatePatrolWaypoints(entityId);
        }
        
        // Move to current waypoint
        if (aiState.currentWaypoint < aiState.patrolWaypoints.length) {
            const waypoint = aiState.patrolWaypoints[aiState.currentWaypoint];
            const distance = position.distanceTo(waypoint.x, waypoint.y);
            
            if (distance < 0.5) {
                // Reached waypoint, move to next
                aiState.currentWaypoint = (aiState.currentWaypoint + 1) % aiState.patrolWaypoints.length;
            } else {
                // Move towards waypoint
                this.moveTowards(entityId, waypoint.x, waypoint.y, 1.5);
                aiState.state = 'patrolling';
            }
        }
    }

    /**
     * Update stationary behavior
     * @param {number} entityId - Entity ID
     * @param {number} deltaTime - Time delta
     */
    updateStationaryBehavior(entityId, deltaTime) {
        const velocity = this.componentManager.get(entityId, 'velocity');
        if (velocity) {
            velocity.stop();
        }
    }

    /**
     * Find nearby enemies
     * @param {number} entityId - Entity ID
     * @param {number} range - Search range
     * @returns {number[]} - Array of enemy entity IDs
     */
    findNearbyEnemies(entityId, range) {
        const position = this.componentManager.get(entityId, 'position');
        if (!position) return [];
        
        const enemies = [];
        const combatEntities = this.componentManager.getAllWith('combat');
        
        for (const [otherId, combat] of combatEntities) {
            if (otherId === entityId) continue;
            
            const otherPosition = this.componentManager.get(otherId, 'position');
            if (!otherPosition) continue;
            
            const distance = position.distanceTo(otherPosition.x, otherPosition.y);
            if (distance <= range) {
                enemies.push(otherId);
            }
        }
        
        return enemies;
    }

    /**
     * Find closest enemy
     * @param {number} entityId - Entity ID
     * @param {number[]} enemies - Array of enemy entity IDs
     * @returns {number} - Closest enemy ID
     */
    findClosestEnemy(entityId, enemies) {
        const position = this.componentManager.get(entityId, 'position');
        if (!position) return enemies[0];
        
        let closestEnemy = enemies[0];
        let closestDistance = Infinity;
        
        for (const enemyId of enemies) {
            const enemyPos = this.getEntityPosition(enemyId);
            const distance = position.distanceTo(enemyPos.x, enemyPos.y);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemyId;
            }
        }
        
        return closestEnemy;
    }

    /**
     * Move entity towards position
     * @param {number} entityId - Entity ID
     * @param {number} targetX - Target X
     * @param {number} targetY - Target Y
     * @param {number} speed - Movement speed
     */
    moveTowards(entityId, targetX, targetY, speed) {
        const position = this.componentManager.get(entityId, 'position');
        const velocity = this.componentManager.get(entityId, 'velocity');
        
        if (!position || !velocity) return;
        
        const dx = targetX - position.x;
        const dy = targetY - position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0.1) {
            velocity.set((dx / distance) * speed, (dy / distance) * speed);
        }
    }

    /**
     * Flee from position
     * @param {number} entityId - Entity ID
     * @param {number} threatX - Threat X
     * @param {number} threatY - Threat Y
     * @param {number} speed - Movement speed
     */
    fleeFrom(entityId, threatX, threatY, speed) {
        const position = this.componentManager.get(entityId, 'position');
        const velocity = this.componentManager.get(entityId, 'velocity');
        
        if (!position || !velocity) return;
        
        const dx = position.x - threatX;
        const dy = position.y - threatY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0.1) {
            velocity.set((dx / distance) * speed, (dy / distance) * speed);
        }
    }

    /**
     * Generate patrol waypoints
     * @param {number} entityId - Entity ID
     * @returns {object[]} - Array of waypoint positions
     */
    generatePatrolWaypoints(entityId) {
        const homePos = this.getEntityPosition(entityId);
        const waypoints = [];
        const patrolRadius = 3.0;
        const numWaypoints = 4;
        
        for (let i = 0; i < numWaypoints; i++) {
            const angle = (i / numWaypoints) * Math.PI * 2;
            waypoints.push({
                x: homePos.x + Math.cos(angle) * patrolRadius,
                y: homePos.y + Math.sin(angle) * patrolRadius
            });
        }
        
        return waypoints;
    }

    /**
     * Set AI behavior for entity
     * @param {number} entityId - Entity ID
     * @param {string} behaviorType - Behavior type
     * @returns {boolean} - True if behavior was set
     */
    setBehavior(entityId, behaviorType) {
        const aiState = this.aiStates.get(entityId);
        if (!aiState) return false;
        
        if (this.behaviors.has(behaviorType)) {
            aiState.behaviorType = behaviorType;
            return true;
        }
        
        return false;
    }

    /**
     * Get AI state for entity
     * @param {number} entityId - Entity ID
     * @returns {object|null} - AI state or null
     */
    getAIState(entityId) {
        return this.aiStates.get(entityId) || null;
    }

    /**
     * Get system statistics
     * @returns {object} - System statistics
     */
    getStats() {
        return {
            processedEntities: this.processedEntities,
            totalProcessingTime: this.totalProcessingTime || 0,
            aiStatesCount: this.aiStates.size,
            availableBehaviors: Array.from(this.behaviors.keys())
        };
    }

    /**
     * Reset statistics
     */
    resetStats() {
        this.processedEntities = 0;
        this.totalProcessingTime = 0;
    }

    /**
     * Clear AI states (for testing/world reset)
     */
    clear() {
        this.aiStates.clear();
    }
}

module.exports = AISystem;
