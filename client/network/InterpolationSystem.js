/**
 * Client Interpolation System
 * Provides smooth 60 FPS movement between server snapshots
 * Implements linear interpolation with prediction and extrapolation
 */

class InterpolationSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        
        // Interpolation configuration
        this.config = {
            interpolationDelay: 100, // milliseconds
            maxExtrapolationTime: 500, // milliseconds
            enablePrediction: true,
            enableExtrapolation: true,
            smoothingFactor: 0.1, // Position smoothing
            velocitySmoothing: 0.2,
            maxInterpolationDistance: 50, // pixels
            targetFPS: 60
        };
        
        // Interpolation state
        this.renderTime = 0;
        this.lastUpdateTime = 0;
        this.interpolationBuffer = [];
        
        // Entity interpolation data
        this.entityInterpolation = new Map(); // entityId -> interpolation data
        
        // Performance tracking
        this.stats = {
            entitiesInterpolated: 0,
            averageInterpolationTime: 0,
            extrapolationCount: 0,
            predictionCount: 0,
            smoothingCount: 0
        };
        
        console.log('🎬 Client Interpolation System initialized');
    }

    /**
     * Initialize interpolation system
     */
    initialize() {
        this.renderTime = Date.now();
        this.lastUpdateTime = Date.now();
        
        console.log('🎬 Interpolation system initialized for 60 FPS');
    }

    /**
     * Update interpolation for all entities
     * @param {Map<number, object>} entities - Local entities
     */
    update(entities) {
        const startTime = performance.now();
        this.renderTime = Date.now();
        
        let interpolatedCount = 0;
        
        for (const [entityId, entity] of entities) {
            if (this.interpolateEntity(entity)) {
                interpolatedCount++;
            }
        }
        
        // Update statistics
        const interpolationTime = performance.now() - startTime;
        this.updateStats(interpolationTime, interpolatedCount);
        
        this.lastUpdateTime = Date.now();
    }

    /**
     * Interpolate single entity
     * @param {object} entity - Entity to interpolate
     * @returns {boolean} - True if entity was interpolated
     */
    interpolateEntity(entity) {
        if (!entity.serverPosition || !entity.positionTimestamp) {
            return false;
        }
        
        // Get interpolation data
        let interpData = this.entityInterpolation.get(entity.id);
        if (!interpData) {
            interpData = {
                previousPosition: { ...entity.serverPosition },
                targetPosition: { ...entity.serverPosition },
                previousTimestamp: entity.positionTimestamp,
                targetTimestamp: entity.positionTimestamp,
                velocity: { ...entity.velocity },
                extrapolationStart: 0,
                isExtrapolating: false
            };
            this.entityInterpolation.set(entity.id, interpData);
        }
        
        // Check if we have new server position
        if (this.hasNewPosition(entity, interpData)) {
            this.updateInterpolationData(entity, interpData);
        }
        
        // Calculate interpolated position
        const interpolatedPos = this.calculateInterpolatedPosition(entity, interpData);
        
        // Apply smoothing
        const smoothedPos = this.applySmoothing(entity, interpolatedPos, interpData);
        
        // Update local position
        entity.localPosition = smoothedPos;
        
        return true;
    }

    /**
     * Check if entity has new server position
     * @param {object} entity - Entity data
     * @param {object} interpData - Interpolation data
     * @returns {boolean} - True if position is new
     */
    hasNewPosition(entity, interpData) {
        return entity.positionTimestamp > interpData.targetTimestamp;
    }

    /**
     * Update interpolation data with new server position
     * @param {object} entity - Entity data
     * @param {object} interpData - Interpolation data
     */
    updateInterpolationData(entity, interpData) {
        // Shift current target to previous
        interpData.previousPosition = { ...interpData.targetPosition };
        interpData.previousTimestamp = interpData.targetTimestamp;
        
        // Set new target
        interpData.targetPosition = { ...entity.serverPosition };
        interpData.targetTimestamp = entity.positionTimestamp;
        
        // Calculate velocity if not provided
        if (entity.velocity && (entity.velocity.x !== 0 || entity.velocity.y !== 0)) {
            interpData.velocity = { ...entity.velocity };
        } else {
            // Calculate velocity from position change
            const timeDiff = interpData.targetTimestamp - interpData.previousTimestamp;
            if (timeDiff > 0) {
                interpData.velocity = {
                    x: (interpData.targetPosition.x - interpData.previousPosition.x) / timeDiff * 1000,
                    y: (interpData.targetPosition.y - interpData.previousPosition.y) / timeDiff * 1000
                };
            }
        }
        
        // Reset extrapolation
        interpData.isExtrapolating = false;
        interpData.extrapolationStart = 0;
    }

    /**
     * Calculate interpolated position
     * @param {object} entity - Entity data
     * @param {object} interpData - Interpolation data
     * @returns {object} - Interpolated position
     */
    calculateInterpolatedPosition(entity, interpData) {
        const now = this.renderTime;
        const interpolationTime = now - this.config.interpolationDelay;
        
        // Check if we should interpolate
        if (interpolationTime <= interpData.previousTimestamp) {
            // Too early, use previous position
            return interpData.previousPosition;
        }
        
        if (interpolationTime >= interpData.targetTimestamp) {
            // Beyond target time, extrapolate
            return this.extrapolatePosition(interpData, interpolationTime);
        }
        
        // Interpolate between previous and target
        return this.linearInterpolate(interpData, interpolationTime);
    }

    /**
     * Linear interpolation between positions
     * @param {object} interpData - Interpolation data
     * @param {number} time - Target time
     * @returns {object} - Interpolated position
     */
    linearInterpolate(interpData, time) {
        const totalTime = interpData.targetTimestamp - interpData.previousTimestamp;
        const elapsedTime = time - interpData.previousTimestamp;
        const factor = Math.min(1, Math.max(0, elapsedTime / totalTime));
        
        return {
            x: interpData.previousPosition.x + (interpData.targetPosition.x - interpData.previousPosition.x) * factor,
            y: interpData.previousPosition.y + (interpData.targetPosition.y - interpData.previousPosition.y) * factor
        };
    }

    /**
     * Extrapolate position beyond last known data
     * @param {object} interpData - Interpolation data
     * @param {number} time - Target time
     * @returns {object} - Extrapolated position
     */
    extrapolatePosition(interpData, time) {
        if (!this.config.enableExtrapolation) {
            return interpData.targetPosition;
        }
        
        // Check extrapolation time limit
        if (!interpData.isExtrapolating) {
            interpData.isExtrapolating = true;
            interpData.extrapolationStart = time;
        }
        
        const extrapolationTime = time - interpData.extrapolationStart;
        if (extrapolationTime > this.config.maxExtrapolationTime) {
            // Too long extrapolating, stop at target position
            return interpData.targetPosition;
        }
        
        // Extrapolate using velocity
        const dt = extrapolationTime / 1000; // Convert to seconds
        const extrapolationDistance = Math.sqrt(
            interpData.velocity.x * interpData.velocity.x + 
            interpData.velocity.y * interpData.velocity.y
        ) * dt;
        
        // Limit extrapolation distance
        if (extrapolationDistance > this.config.maxInterpolationDistance) {
            return interpData.targetPosition;
        }
        
        this.stats.extrapolationCount++;
        
        return {
            x: interpData.targetPosition.x + interpData.velocity.x * dt,
            y: interpData.targetPosition.y + interpData.velocity.y * dt
        };
    }

    /**
     * Apply smoothing to interpolated position
     * @param {object} entity - Entity data
     * @param {object} targetPos - Target position
     * @param {object} interpData - Interpolation data
     * @returns {object} - Smoothed position
     */
    applySmoothing(entity, targetPos, interpData) {
        if (!entity.localPosition) {
            // First interpolation, use target directly
            return { ...targetPos };
        }
        
        const smoothingFactor = this.config.smoothingFactor;
        
        // Apply smoothing
        const smoothedPos = {
            x: entity.localPosition.x + (targetPos.x - entity.localPosition.x) * smoothingFactor,
            y: entity.localPosition.y + (targetPos.y - entity.localPosition.y) * smoothingFactor
        };
        
        // Check if smoothing was applied
        const distance = Math.sqrt(
            Math.pow(targetPos.x - smoothedPos.x, 2) + 
            Math.pow(targetPos.y - smoothedPos.y, 2)
        );
        
        if (distance > 0.1) {
            this.stats.smoothingCount++;
        }
        
        return smoothedPos;
    }

    /**
     * Get interpolated position for entity
     * @param {number} entityId - Entity ID
     * @param {number} renderTime - Render timestamp
     * @returns {object|null} - Interpolated position
     */
    getInterpolatedPosition(entityId, renderTime) {
        const interpData = this.entityInterpolation.get(entityId);
        if (!interpData) {
            return null;
        }
        
        // Create temporary entity for interpolation
        const tempEntity = {
            id: entityId,
            serverPosition: interpData.targetPosition,
            positionTimestamp: interpData.targetTimestamp,
            velocity: interpData.velocity,
            localPosition: null
        };
        
        // Update render time
        const oldRenderTime = this.renderTime;
        this.renderTime = renderTime || Date.now();
        
        // Interpolate
        this.interpolateEntity(tempEntity);
        
        // Restore render time
        this.renderTime = oldRenderTime;
        
        return tempEntity.localPosition;
    }

    /**
     * Predict entity position
     * @param {number} entityId - Entity ID
     * @param {number} predictionTime - Prediction time in milliseconds
     * @returns {object|null} - Predicted position
     */
    predictPosition(entityId, predictionTime) {
        if (!this.config.enablePrediction) {
            return null;
        }
        
        const interpData = this.entityInterpolation.get(entityId);
        if (!interpData) {
            return null;
        }
        
        const dt = predictionTime / 1000; // Convert to seconds
        const predictedPos = {
            x: interpData.targetPosition.x + interpData.velocity.x * dt,
            y: interpData.targetPosition.y + interpData.velocity.y * dt
        };
        
        this.stats.predictionCount++;
        
        return predictedPos;
    }

    /**
     * Update interpolation statistics
     * @param {number} interpolationTime - Time to interpolate
     * @param {number} entityCount - Number of entities interpolated
     */
    updateStats(interpolationTime, entityCount) {
        this.stats.entitiesInterpolated += entityCount;
        this.stats.averageInterpolationTime = 
            (this.stats.averageInterpolationTime + interpolationTime) / 2;
    }

    /**
     * Get performance statistics
     * @returns {object} - Performance stats
     */
    getStats() {
        return {
            ...this.stats,
            entityCount: this.entityInterpolation.size,
            interpolationDelay: this.config.interpolationDelay,
            targetFPS: this.config.targetFPS
        };
    }

    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            entitiesInterpolated: 0,
            averageInterpolationTime: 0,
            extrapolationCount: 0,
            predictionCount: 0,
            smoothingCount: 0
        };
    }

    /**
     * Clear all interpolation data
     */
    clear() {
        this.entityInterpolation.clear();
        this.interpolationBuffer = [];
        this.renderTime = Date.now();
        this.lastUpdateTime = Date.now();
    }

    /**
     * Update configuration
     * @param {object} newConfig - New configuration
     */
    updateConfig(newConfig) {
        Object.assign(this.config, newConfig);
        console.log('🎬 Interpolation configuration updated:', newConfig);
    }

    /**
     * Debug visualization
     * @returns {object} - Debug information
     */
    debugVisualization() {
        const entityData = [];
        
        for (const [entityId, interpData] of this.entityInterpolation) {
            entityData.push({
                entityId,
                hasVelocity: interpData.velocity.x !== 0 || interpData.velocity.y !== 0,
                isExtrapolating: interpData.isExtrapolating,
                extrapolationTime: interpData.isExtrapolating ? 
                    Date.now() - interpData.extrapolationStart : 0
            });
        }
        
        return {
            config: this.config,
            stats: this.getStats(),
            entityCount: this.entityInterpolation.size,
            entities: entityData
        };
    }
}

module.exports = InterpolationSystem;
