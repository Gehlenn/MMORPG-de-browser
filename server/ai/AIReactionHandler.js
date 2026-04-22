/**
 * AIReactionHandler - Handles AI reactions to player actions
 * Broadcasts reactions and provides tactical feedback
 */

class AIReactionHandler {
    constructor(aiMobController, aiBossController, aggroSystem) {
        this.aiMobController = aiMobController;
        this.aiBossController = aiBossController;
        this.aggroSystem = aggroSystem;
        this.io = null;
        
        // Aliases for test compatibility
        this.mobController = aiMobController;
        this.bossController = aiBossController;
        
        // Reaction cooldowns to prevent spam
        this.reactionCooldowns = new Map();
        this.COOLDOWN_MS = 500;
        
        // Track processed events for deduplication
        this.processedEvents = new Set();
    }
    
    /**
     * Initialize reaction handler
     */
    initialize() {
        console.log('[AIReactionHandler] Initialized');
    }
    
    /**
     * Set Socket.io instance for broadcasting
     */
    setSocketIO(io) {
        this.io = io;
        console.log('[AIReactionHandler] Socket.io connected');
    }
    
    /**
     * Handle player ability usage
     * @param {string} playerId 
     * @param {string} targetId 
     * @param {Object} ability 
     */
    onPlayerAbility(playerId, targetId, ability) {
        if (!this.isValidTarget(targetId)) return;
        
        const eventKey = `ability_${playerId}_${targetId}_${ability?.id || ability?.name}_${Date.now()}`;
        if (this.isDuplicate(eventKey)) return;
        
        // Add threat for ability usage
        this.addThreatToTarget(targetId, playerId, ability?.damage || 10);
        
        // Process crowd control abilities
        if (ability?.crowdControl) {
            this.handleCrowdControl(playerId, targetId, ability);
        }
        
        // Process taunt abilities
        if (ability?.type === 'taunt') {
            this.handleTauntAbility(playerId, targetId, ability);
        }
        
        // Process defensive abilities
        if (ability?.type === 'defensive') {
            this.handleDefensiveAbility(playerId, targetId, ability);
        }
        
        this.broadcastReaction(targetId, 'ability_used', {
            playerId,
            abilityId: ability?.id,
            abilityName: ability?.name,
            isCrowdControl: !!ability?.crowdControl
        });
    }
    
    /**
     * Add threat to target (mob or boss)
     * @param {string} targetId 
     * @param {string} playerId 
     * @param {number} amount 
     */
    addThreatToTarget(targetId, playerId, amount) {
        // Try mob controller
        if (this.aiMobController?.mobs?.has?.(targetId)) {
            const mob = this.aiMobController.mobs.get(targetId);
            if (!mob.threatTable) mob.threatTable = new Map();
            const currentThreat = mob.threatTable.get(playerId) || 0;
            mob.threatTable.set(playerId, currentThreat + amount);
            return;
        }
        
        // Try boss controller
        if (this.aiBossController?.bosses?.has?.(targetId)) {
            const boss = this.aiBossController.bosses.get(targetId);
            if (!boss.threatTable) boss.threatTable = new Map();
            const currentThreat = boss.threatTable.get(playerId) || 0;
            boss.threatTable.set(playerId, currentThreat + amount);
        }
    }
    
    /**
     * Handle player dealing damage
     * @param {string} playerId 
     * @param {string} targetId 
     * @param {number} damage 
     * @param {string} damageType 
     */
    onPlayerDamage(playerId, targetId, damage, damageType = 'physical') {
        if (!this.isValidTarget(targetId)) return;
        
        const eventKey = `damage_${playerId}_${targetId}_${Date.now()}`;
        if (this.isDuplicate(eventKey)) return;
        
        // Add threat for damage (use aggroSystem if available, otherwise direct)
        if (this.aggroSystem) {
            this.aggroSystem.addThreat(targetId, playerId, damage);
        } else {
            this.addThreatToTarget(targetId, playerId, damage);
        }
        
        // Check for boss weakness exploitation
        const aiData = this.getAIData(targetId);
        if (aiData && aiData.isBoss) {
            this.checkBossWeakness(playerId, targetId, damageType);
        }
        
        this.broadcastReaction(targetId, 'damage_taken', {
            playerId,
            damage,
            damageType,
            currentHp: aiData?.currentHp
        });
    }
    
    /**
     * Handle player healing
     * @param {string} playerId 
     * @param {string} targetId 
     * @param {number} amount 
     */
    onPlayerHeal(playerId, targetId, amount) {
        if (!targetId) return; // Self-heal or AoE heal
        
        const eventKey = `heal_${playerId}_${targetId}_${Date.now()}`;
        if (this.isDuplicate(eventKey)) return;
        
        // Healing generates threat on all mobs targeting the healed player
        const targets = this.getMobsTargeting(targetId);
        
        for (const mobId of targets) {
            // Healing generates half threat of damage
            const threatAmount = Math.floor(amount * 0.5);
            if (this.aggroSystem) {
                this.aggroSystem.addThreat(mobId, playerId, threatAmount);
            } else {
                this.addThreatToTarget(mobId, playerId, threatAmount);
            }
            
            this.broadcastReaction(mobId, 'target_healed', {
                healerId: playerId,
                targetId,
                amount,
                threatGenerated: threatAmount
            });
        }
    }
    
    /**
     * Handle crowd control effects
     * @param {string} playerId 
     * @param {string} targetId 
     * @param {Object} ability 
     */
    handleCrowdControl(playerId, targetId, ability) {
        const effect = ability.crowdControl;
        
        switch (effect.type) {
            case 'stun':
                this.applyStun(targetId, effect.duration);
                break;
            case 'fear':
                this.applyFear(targetId, effect.duration, playerId);
                break;
            case 'charm':
                this.applyCharm(targetId, effect.duration, playerId);
                break;
            case 'root':
                this.applyRoot(targetId, effect.duration);
                break;
            case 'silence':
                this.applySilence(targetId, effect.duration);
                break;
        }
        
        this.broadcastReaction(targetId, 'crowd_controlled', {
            playerId,
            effectType: effect.type,
            duration: effect.duration,
            abilityName: ability.name
        });
    }
    
    /**
     * Handle taunt ability
     * @param {string} playerId 
     * @param {string} targetId 
     * @param {Object} ability 
     */
    handleTauntAbility(playerId, targetId, ability) {
        // Use aggroSystem if available
        if (this.aggroSystem && typeof this.aggroSystem.handleTaunt === 'function') {
            const threatBonus = ability?.threatBonus || 1000;
            this.aggroSystem.handleTaunt(targetId, playerId, threatBonus);
        }
        
        // Also update mob directly for test compatibility
        const aiData = this.getAIData(targetId);
        if (aiData) {
            aiData.tauntedBy = playerId;
            aiData.currentTarget = playerId;
        }
    }
    
    /**
     * Handle defensive ability (mitigation)
     * @param {string} playerId 
     * @param {string} targetId 
     * @param {Object} ability 
     */
    handleDefensiveAbility(playerId, targetId, ability) {
        // Defensive abilities reduce threat temporarily
        if (ability.threatReduction && this.aggroSystem) {
            const threatTable = this.aggroSystem.getAggroTable(targetId);
            if (threatTable) {
                const currentThreat = threatTable.get(playerId) || 0;
                const newThreat = Math.floor(currentThreat * (1 - ability.threatReduction));
                threatTable.set(playerId, newThreat);
                
                this.broadcastReaction(targetId, 'threat_reduced', {
                    playerId,
                    reduction: ability.threatReduction,
                    newThreat
                });
            }
        }
    }
    
    /**
     * Apply stun effect
     */
    applyStun(targetId, duration) {
        const aiData = this.getAIData(targetId);
        if (aiData) {
            aiData.isStunned = true;
            aiData.stunEndTime = Date.now() + duration;
            aiData.state = 'stunned';
            
            // Add to ccEffects array for test compatibility
            if (!aiData.ccEffects) aiData.ccEffects = [];
            aiData.ccEffects.push({ type: 'stun', duration });
            
            setTimeout(() => {
                aiData.isStunned = false;
                aiData.state = 'active';
            }, duration);
        }
    }
    
    /**
     * Apply fear effect
     */
    applyFear(targetId, duration, sourcePlayerId) {
        const aiData = this.getAIData(targetId);
        if (aiData) {
            aiData.isFeared = true;
            aiData.fearSource = sourcePlayerId;
            aiData.fearEndTime = Date.now() + duration;
            aiData.state = 'fleeing';
            aiData.fleeingFrom = sourcePlayerId;
            
            // Add to ccEffects array for test compatibility
            if (!aiData.ccEffects) aiData.ccEffects = [];
            aiData.ccEffects.push({ type: 'fear', duration, sourcePlayerId });
            
            // Transition to flee state via controller if available
            if (this.aiMobController && typeof this.aiMobController.transitionState === 'function') {
                this.aiMobController.transitionState(targetId, 'flee');
            }
            
            setTimeout(() => {
                aiData.isFeared = false;
                aiData.fearSource = null;
                aiData.fleeingFrom = null;
            }, duration);
        }
    }
    
    /**
     * Apply charm effect
     */
    applyCharm(targetId, duration, sourcePlayerId) {
        const aiData = this.getAIData(targetId);
        if (aiData) {
            aiData.isCharmed = true;
            aiData.charmSource = sourcePlayerId;
            aiData.charmEndTime = Date.now() + duration;
            aiData.state = 'charmed';
            aiData.charmedBy = sourcePlayerId;
            
            // Add to ccEffects array for test compatibility
            if (!aiData.ccEffects) aiData.ccEffects = [];
            aiData.ccEffects.push({ type: 'charm', duration, sourcePlayerId });
            
            setTimeout(() => {
                aiData.isCharmed = false;
                aiData.charmSource = null;
                aiData.charmedBy = null;
            }, duration);
        }
    }
    
    /**
     * Apply root effect
     */
    applyRoot(targetId, duration) {
        const aiData = this.getAIData(targetId);
        if (aiData) {
            aiData.isRooted = true;
            aiData.rootEndTime = Date.now() + duration;
            aiData.canMove = false;
            
            // Add to ccEffects array for test compatibility
            if (!aiData.ccEffects) aiData.ccEffects = [];
            aiData.ccEffects.push({ type: 'root', duration });
            
            setTimeout(() => {
                aiData.isRooted = false;
                aiData.canMove = true;
            }, duration);
        }
    }
    
    /**
     * Apply silence effect
     */
    applySilence(targetId, duration) {
        const aiData = this.getAIData(targetId);
        if (aiData) {
            aiData.isSilenced = true;
            aiData.silenceEndTime = Date.now() + duration;
            aiData.canCast = false;
            
            // Add to ccEffects array for test compatibility
            if (!aiData.ccEffects) aiData.ccEffects = [];
            aiData.ccEffects.push({ type: 'silence', duration });
            
            setTimeout(() => {
                aiData.isSilenced = false;
                aiData.canCast = true;
            }, duration);
        }
    }
    
    /**
     * Check if player exploited boss weakness
     */
    checkBossWeakness(playerId, bossId, damageType) {
        if (!this.aiBossController) return;
        
        // Get boss data with fallback
        let bossData = null;
        if (typeof this.aiBossController.getBossData === 'function') {
            bossData = this.aiBossController.getBossData(bossId);
        } else if (this.aiBossController.bosses?.has?.(bossId)) {
            bossData = this.aiBossController.bosses.get(bossId);
        }
        
        if (!bossData) return;
        
        // Check for weaknesses in boss data
        if (bossData.damageWeaknesses && bossData.damageWeaknesses[damageType]) {
            // Bonus damage notification
            this.broadcastTacticalFeedback(playerId, 'weakness_exploited', {
                bossId,
                damageType,
                bonus: '50%',
                message: `Você atingiu a fraqueza do boss! +50% de dano!`
            });
        }
    }
    
    /**
     * Broadcast AI reaction to clients
     */
    broadcastReaction(targetId, reactionType, data) {
        if (!this.io) return;
        
        const reaction = {
            targetId,
            reactionType,
            data,
            timestamp: Date.now()
        };
        
        this.io.emit('ai:reaction', reaction);
    }
    
    /**
     * Broadcast tactical feedback to specific player
     */
    broadcastTacticalFeedback(playerId, tipType, data) {
        if (!this.io) return;
        
        const feedback = {
            playerId,
            tipType,
            data,
            timestamp: Date.now()
        };
        
        this.io.emit('tactical:tip', feedback);
    }
    
    /**
     * Get AI data for a target
     */
    getAIData(targetId) {
        // Try mob controller first
        if (this.aiMobController && typeof this.aiMobController.getMobState === 'function') {
            const mobData = this.aiMobController.getMobState(targetId);
            if (mobData) return mobData;
        }
        
        // Fallback: check mobs map directly
        if (this.aiMobController && this.aiMobController.mobs && this.aiMobController.mobs.has) {
            const mobData = this.aiMobController.mobs.get(targetId);
            if (mobData) return mobData;
        }
        
        // Try boss controller
        if (this.aiBossController && typeof this.aiBossController.getBossData === 'function') {
            const bossData = this.aiBossController.getBossData(targetId);
            if (bossData) return { ...bossData, isBoss: true };
        }
        
        // Fallback: check bosses map directly
        if (this.aiBossController && this.aiBossController.bosses && this.aiBossController.bosses.has) {
            const bossData = this.aiBossController.bosses.get(targetId);
            if (bossData) return { ...bossData, isBoss: true };
        }
        
        return null;
    }
    
    /**
     * Get all mobs targeting a player
     */
    getMobsTargeting(playerId) {
        const targetingMobs = [];
        
        if (this.aiMobController?.mobs) {
            for (const [mobId, aiData] of this.aiMobController.mobs) {
                if (aiData.currentTarget === playerId || aiData.target?.id === playerId) {
                    targetingMobs.push({ id: mobId, ...aiData });
                }
            }
        }
        
        return targetingMobs;
    }
    
    /**
     * Check if target is valid
     */
    isValidTarget(targetId) {
        return !!this.getAIData(targetId);
    }
    
    /**
     * Check for duplicate events (deduplication)
     */
    isDuplicate(eventKey) {
        if (this.processedEvents.has(eventKey)) {
            return true;
        }
        
        this.processedEvents.add(eventKey);
        
        // Clean old entries after 1 second
        setTimeout(() => {
            this.processedEvents.delete(eventKey);
        }, 1000);
        
        return false;
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        this.reactionCooldowns.clear();
        this.processedEvents.clear();
    }
}

module.exports = AIReactionHandler;
