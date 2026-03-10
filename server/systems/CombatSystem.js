/**
 * Combat System (ECS)
 * Handles combat interactions between entities with CombatComponent and HealthComponent
 */

class CombatSystem {
    constructor(entityManager, componentManager) {
        this.entityManager = entityManager;
        this.componentManager = componentManager;
        this.name = 'CombatSystem';
        
        // Combat configuration
        this.combatLog = []; // Array of combat events
        this.maxCombatLogSize = 1000;
        this.combatRange = 1.5; // Default combat range in tiles
        
        // Performance tracking
        this.processedEntities = 0;
        this.totalDamageDealt = 0;
        this.totalHealingDone = 0;
    }

    /**
     * Update combat system
     * @param {number} deltaTime - Time since last update in milliseconds
     */
    update(deltaTime) {
        const startTime = performance.now();
        
        this.processedEntities = 0;
        
        // Get all entities with combat components
        const combatEntities = this.componentManager.getAllWith('combat');
        const healthEntities = this.componentManager.getAllWith('health');
        
        // Update status effects for all combat entities
        for (const [entityId, combat] of combatEntities) {
            this.updateStatusEffects(entityId, combat);
            this.processedEntities++;
        }
        
        // Update regeneration for all health entities
        for (const [entityId, health] of healthEntities) {
            health.updateRegeneration(Date.now());
        }
        
        const endTime = performance.now();
        this.totalProcessingTime = endTime - startTime;
    }

    /**
     * Process attack from attacker to target
     * @param {number} attackerId - Attacker entity ID
     * @param {number} targetId - Target entity ID
     * @returns {object} - Attack result
     */
    processAttack(attackerId, targetId) {
        const attackerCombat = this.componentManager.get(attackerId, 'combat');
        const targetCombat = this.componentManager.get(targetId, 'combat');
        const targetHealth = this.componentManager.get(targetId, 'health');
        
        if (!attackerCombat || !targetHealth) {
            return { success: false, reason: 'Missing combat or health components' };
        }
        
        // Check attack range (if position components exist)
        if (!this.isInRange(attackerId, targetId)) {
            return { success: false, reason: 'Target out of range' };
        }
        
        // Calculate damage
        const targetDefense = targetCombat ? targetCombat.defense : 0;
        const damageResult = attackerCombat.calculateDamage(targetDefense);
        
        if (!damageResult.canAttack) {
            return { success: false, reason: 'Attack on cooldown' };
        }
        
        // Apply damage with resistance calculation
        const actualDamage = targetHealth.damage(
            damageResult.damage, 
            attackerCombat.damageType
        );
        
        // Update statistics
        this.totalDamageDealt += actualDamage;
        
        // Log combat event
        this.logCombatEvent({
            type: 'attack',
            attackerId,
            targetId,
            damage: actualDamage,
            isCritical: damageResult.isCritical,
            damageType: attackerCombat.damageType,
            timestamp: Date.now()
        });
        
        // Check if target died
        if (targetHealth.isDead) {
            this.handleEntityDeath(targetId, attackerId);
        }
        
        return {
            success: true,
            damage: actualDamage,
            isCritical: damageResult.isCritical,
            targetKilled: targetHealth.isDead
        };
    }

    /**
     * Process healing from healer to target
     * @param {number} healerId - Healer entity ID
     * @param {number} targetId - Target entity ID
     * @param {number} healAmount - Amount to heal
     * @returns {object} - Heal result
     */
    processHeal(healerId, targetId, healAmount) {
        const targetHealth = this.componentManager.get(targetId, 'health');
        
        if (!targetHealth) {
            return { success: false, reason: 'Target missing health component' };
        }
        
        if (targetHealth.isDead) {
            return { success: false, reason: 'Cannot heal dead entity' };
        }
        
        // Apply healing
        const actualHealing = targetHealth.heal(healAmount);
        
        // Update statistics
        this.totalHealingDone += actualHealing;
        
        // Log combat event
        this.logCombatEvent({
            type: 'heal',
            healerId,
            targetId,
            amount: actualHealing,
            timestamp: Date.now()
        });
        
        return {
            success: true,
            amount: actualHealing
        };
    }

    /**
     * Handle entity death
     * @param {number} entityId - Entity that died
     * @param {number} killerId - Entity that killed it (optional)
     */
    handleEntityDeath(entityId, killerId = null) {
        const combat = this.componentManager.get(entityId, 'combat');
        const health = this.componentManager.get(entityId, 'health');
        
        // Award experience to killer
        if (killerId && combat) {
            const killerCombat = this.componentManager.get(killerId, 'combat');
            if (killerCombat) {
                const expReward = this.calculateExperienceReward(combat.level);
                const leveledUp = killerCombat.addExperience(expReward);
                
                this.logCombatEvent({
                    type: 'experience',
                    entityId: killerId,
                    amount: expReward,
                    leveledUp,
                    source: entityId,
                    timestamp: Date.now()
                });
            }
        }
        
        // Log death event
        this.logCombatEvent({
            type: 'death',
            entityId,
            killerId,
            timestamp: Date.now()
        });
        
        console.log(`Entity ${entityId} died${killerId ? ` (killed by ${killerId})` : ''}`);
    }

    /**
     * Calculate experience reward for killing entity
     * @param {number} entityLevel - Level of killed entity
     * @returns {number} - Experience reward
     */
    calculateExperienceReward(entityLevel) {
        return Math.floor(50 * Math.pow(1.1, entityLevel - 1));
    }

    /**
     * Check if entities are in combat range
     * @param {number} entityId1 - First entity ID
     * @param {number} entityId2 - Second entity ID
     * @returns {boolean} - True if in range
     */
    isInRange(entityId1, entityId2) {
        const pos1 = this.componentManager.get(entityId1, 'position');
        const pos2 = this.componentManager.get(entityId2, 'position');
        
        if (!pos1 || !pos2) return true; // Assume in range if no positions
        
        const distance = pos1.distanceTo(pos2.x, pos2.y);
        return distance <= this.combatRange;
    }

    /**
     * Update status effects for entity
     * @param {number} entityId - Entity ID
     * @param {object} combat - Combat component
     */
    updateStatusEffects(entityId, combat) {
        const expiredEffects = combat.updateStatusEffects(Date.now());
        
        for (const effectName of expiredEffects) {
            this.logCombatEvent({
                type: 'status_expired',
                entityId,
                effect: effectName,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Add status effect to entity
     * @param {number} entityId - Entity ID
     * @param {string} effectName - Effect name
     * @param {number} duration - Duration in milliseconds
     * @returns {boolean} - True if effect was added
     */
    addStatusEffect(entityId, effectName, duration) {
        const combat = this.componentManager.get(entityId, 'combat');
        if (!combat) return false;
        
        combat.addStatusEffect(effectName, duration);
        
        this.logCombatEvent({
            type: 'status_applied',
            entityId,
            effect: effectName,
            duration,
            timestamp: Date.now()
        });
        
        return true;
    }

    /**
     * Log combat event
     * @param {object} event - Combat event
     */
    logCombatEvent(event) {
        this.combatLog.push(event);
        
        // Limit log size
        if (this.combatLog.length > this.maxCombatLogSize) {
            this.combatLog.shift();
        }
    }

    /**
     * Get combat log
     * @param {number} limit - Maximum number of events to return
     * @returns {object[]} - Array of combat events
     */
    getCombatLog(limit = 100) {
        return this.combatLog.slice(-limit);
    }

    /**
     * Get entities in combat
     * @returns {number[]} - Array of entity IDs in combat
     */
    getEntitiesInCombat() {
        const combatEntities = [];
        const combatComponents = this.componentManager.getAllWith('combat');
        
        for (const entityId of combatComponents.keys()) {
            combatEntities.push(entityId);
        }
        
        return combatEntities;
    }

    /**
     * Get nearby enemies for entity
     * @param {number} entityId - Entity ID
     * @param {number} range - Search range
     * @returns {number[]} - Array of enemy entity IDs
     */
    getNearbyEnemies(entityId, range = this.combatRange) {
        const enemies = [];
        const position = this.componentManager.get(entityId, 'position');
        
        if (!position) return enemies;
        
        const combatEntities = this.componentManager.getAllWith('combat');
        
        for (const [otherId, otherCombat] of combatEntities) {
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
     * Get system statistics
     * @returns {object} - System statistics
     */
    getStats() {
        return {
            processedEntities: this.processedEntities,
            totalProcessingTime: this.totalProcessingTime || 0,
            totalDamageDealt: this.totalDamageDealt,
            totalHealingDone: this.totalHealingDone,
            combatLogSize: this.combatLog.length
        };
    }

    /**
     * Reset statistics
     */
    resetStats() {
        this.processedEntities = 0;
        this.totalProcessingTime = 0;
        this.totalDamageDealt = 0;
        this.totalHealingDone = 0;
        this.combatLog = [];
    }
}

module.exports = CombatSystem;
