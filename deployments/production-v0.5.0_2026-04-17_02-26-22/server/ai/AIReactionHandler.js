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
        
        const eventKey = `ability_${playerId}_${targetId}_${ability.id}_${Date.now()}`;
        if (this.isDuplicate(eventKey)) return;
        
        // Process crowd control abilities
        if (ability.crowdControl) {
            this.handleCrowdControl(playerId, targetId, ability);
        }
        
        // Process taunt abilities
        if (ability.type === 'taunt') {
            this.handleTauntAbility(playerId, targetId, ability);
        }
        
        // Process defensive abilities
        if (ability.type === 'defensive') {
            this.handleDefensiveAbility(playerId, targetId, ability);
        }
        
        this.broadcastReaction(targetId, 'ability_used', {
            playerId,
            abilityId: ability.id,
            abilityName: ability.name,
            isCrowdControl: !!ability.crowdControl
        });
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
        
        // Add threat for damage
        if (this.aggroSystem) {
            this.aggroSystem.addThreat(targetId, playerId, damage);
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
        if (this.aggroSystem) {
            const threatBonus = ability.threatBonus || 1000;
            this.aggroSystem.handleTaunt(targetId, playerId, threatBonus);
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
            
            setTimeout(() => {
                aiData.isStunned = false;
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
            
            // Transition to flee state
            if (this.aiMobController) {
                this.aiMobController.transitionState(targetId, 'flee');
            }
            
            setTimeout(() => {
                aiData.isFeared = false;
                aiData.fearSource = null;
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
            
            setTimeout(() => {
                aiData.isCharmed = false;
                aiData.charmSource = null;
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
            
            setTimeout(() => {
                aiData.isRooted = false;
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
            
            setTimeout(() => {
                aiData.isSilenced = false;
            }, duration);
        }
    }
    
    /**
     * Check if player exploited boss weakness
     */
    checkBossWeakness(playerId, bossId, damageType) {
        if (!this.aiBossController) return;
        
        const bossData = this.aiBossController.getBossData(bossId);
        if (!bossData) return;
        
        const phase = bossData.currentPhase;
        const weakness = this.aiBossController.getPhaseWeakness(phase);
        
        if (weakness === damageType) {
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
        if (this.aiMobController) {
            const mobData = this.aiMobController.getMobState(targetId);
            if (mobData) return mobData;
        }
        
        // Try boss controller
        if (this.aiBossController) {
            const bossData = this.aiBossController.getBossData(targetId);
            if (bossData) return { ...bossData, isBoss: true };
        }
        
        return null;
    }
    
    /**
     * Get all mobs targeting a player
     */
    getMobsTargeting(playerId) {
        const targetingMobs = [];
        
        if (this.aiMobController) {
            for (const [mobId, aiData] of this.aiMobController.mobs) {
                if (aiData.target?.id === playerId) {
                    targetingMobs.push(mobId);
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

export default AIReactionHandler;
