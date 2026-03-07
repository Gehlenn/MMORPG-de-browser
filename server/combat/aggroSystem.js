/**
 * Aggro System - Threat and Hate Management
 * Manages monster aggro, threat generation, and target selection
 * Version 0.3 - Complete Architecture Integration
 */

class AggroSystem {
    constructor(worldManager, combatSystem) {
        this.worldManager = worldManager;
        this.combatSystem = combatSystem;
        
        // Aggro configuration
        this.config = {
            baseAggroRadius: 50,
            maxAggroRadius: 150,
            aggroDecayRate: 0.95, // 5% threat decay per second
            threatMultiplier: 1.0,
            healingThreatMultiplier: 0.5,
            buffThreatMultiplier: 0.2,
            debuffThreatMultiplier: 0.3,
            
            // Distance modifiers
            rangedThreatMultiplier: 0.8,
            meleeThreatMultiplier: 1.2,
            
            // Level modifiers
            levelDiffThreatModifier: 0.1, // ±10% per level difference
            
            // Special aggro behaviors
            assistRadius: 100, // Radius for monster assistance
            callForHelpChance: 0.3, // 30% chance to call for help
            fleeThreshold: 0.2, // Flee when health below 20%
            
            // Aggro persistence
            aggroMemoryDuration: 30000, // 30 seconds
            resetOnDeath: true,
            persistAfterCombat: false
        };
        
        // Active aggro tables
        this.aggroTables = new Map(); // monsterId -> Map<playerId, threat>
        this.aggroHistory = new Map(); // monsterId -> Array<aggro events>
        this.assistCooldowns = new Map(); // monsterId -> last assist time
        
        // Threat modifiers
        this.threatModifiers = new Map();
        this.initializeThreatModifiers();
        
        // Monster behaviors
        this.monsterBehaviors = new Map();
        this.initializeMonsterBehaviors();
        
        // Statistics
        this.aggroStats = {
            totalAggroEvents: 0,
            totalAssists: 0,
            totalThreatGenerated: 0,
            averageAggroDuration: 0,
            mostHatedPlayers: new Map()
        };
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        // Setup event listeners
        this.setupEventListeners();
        
        // Start aggro update loop
        this.startAggroLoop();
        
        console.log('Aggro System initialized');
    }
    
    setupEventListeners() {
        // Listen to combat events
        this.combatSystem.on('damage_dealt', (attackerId, targetId, damage, damageType) => {
            this.onDamageDealt(attackerId, targetId, damage, damageType);
        });
        
        this.combatSystem.on('healing_done', (healerId, targetId, healing) => {
            this.onHealingDone(healerId, targetId, healing);
        });
        
        this.combatSystem.on('status_effect_applied', (casterId, targetId, effectId) => {
            this.onStatusEffectApplied(casterId, targetId, effectId);
        });
        
        this.combatSystem.on('combat_start', (combatId, participants) => {
            this.onCombatStart(combatId, participants);
        });
        
        this.combatSystem.on('combat_end', (combatId, winner) => {
            this.onCombatEnd(combatId);
        });
        
        // Listen to monster death
        this.worldManager.on('monster_death', (monsterId, killerId) => {
            this.onMonsterDeath(monsterId, killerId);
        });
        
        // Listen to player movement
        this.worldManager.on('player_moved', (playerId, x, y) => {
            this.onPlayerMoved(playerId, x, y);
        });
    }
    
    startAggroLoop() {
        setInterval(() => {
            this.updateAggroTables();
            this.checkForNewAggro();
            this.processMonsterAssists();
        }, 1000); // Update every second
    }
    
    initializeThreatModifiers() {
        // Damage-based threat
        this.threatModifiers.set('damage', {
            base: 1.0,
            type: 'damage',
            description: 'Threat from damage dealt'
        });
        
        // Healing threat
        this.threatModifiers.set('healing', {
            base: 0.5,
            type: 'healing',
            description: 'Threat from healing (reduced)'
        });
        
        // Buff threat
        this.threatModifiers.set('buff', {
            base: 0.2,
            type: 'buff',
            description: 'Threat from applying buffs (low)'
        });
        
        // Debuff threat
        this.threatModifiers.set('debuff', {
            base: 0.3,
            type: 'debuff',
            description: 'Threat from applying debuffs'
        });
        
        // Taunt threat
        this.threatModifiers.set('taunt', {
            base: 5.0,
            type: 'taunt',
            description: 'High threat from taunt abilities'
        });
        
        // Crowd control threat
        this.threatModifiers.set('crowd_control', {
            base: 1.5,
            type: 'crowd_control',
            description: 'Threat from stun/freeze/etc'
        });
        
        // Pull threat
        this.threatModifiers.set('pull', {
            base: 2.0,
            type: 'pull',
            description: 'Threat from initial pull'
        });
        
        // Proximity threat
        this.threatModifiers.set('proximity', {
            base: 0.1,
            type: 'proximity',
            description: 'Threat from being too close'
        });
    }
    
    initializeMonsterBehaviors() {
        // Aggressive monsters - high threat sensitivity
        this.monsterBehaviors.set('aggressive', {
            aggroRadius: 1.2,
            threatMultiplier: 1.5,
            assistChance: 0.5,
            callForHelp: true,
            fleeThreshold: 0.1,
            targetPreference: 'highest_threat',
            description: 'Always attacks highest threat target'
        });
        
        // Territorial monsters - defend their area
        this.monsterBehaviors.set('territorial', {
            aggroRadius: 0.8,
            threatMultiplier: 1.2,
            assistChance: 0.7,
            callForHelp: true,
            fleeThreshold: 0.05,
            targetPreference: 'nearest',
            description: 'Defends territory, assists allies'
        });
        
        // Pack hunters - coordinate attacks
        this.monsterBehaviors.set('pack_hunter', {
            aggroRadius: 1.0,
            threatMultiplier: 1.0,
            assistChance: 0.8,
            callForHelp: true,
            fleeThreshold: 0.15,
            targetPreference: 'same_target',
            description: 'Coordinates with pack members'
        });
        
        // Cowardly monsters - avoid combat
        this.monsterBehaviors.set('cowardly', {
            aggroRadius: 0.5,
            threatMultiplier: 0.8,
            assistChance: 0.1,
            callForHelp: false,
            fleeThreshold: 0.4,
            targetPreference: 'lowest_threat',
            description: 'Avoids combat, flees easily'
        });
        
        // Guardian monsters - protect allies
        this.monsterBehaviors.set('guardian', {
            aggroRadius: 1.0,
            threatMultiplier: 1.3,
            assistChance: 1.0,
            callForHelp: true,
            fleeThreshold: 0.0,
            targetPreference: 'attacking_allies',
            description: 'Protects allies, never flees'
        });
        
        // Boss monsters - complex behavior
        this.monsterBehaviors.set('boss', {
            aggroRadius: 1.5,
            threatMultiplier: 1.0,
            assistChance: 0.0,
            callForHelp: false,
            fleeThreshold: 0.0,
            targetPreference: 'strategic',
            description: 'Complex targeting, strategic decisions'
        });
    }
    
    // Main aggro methods
    addThreat(monsterId, playerId, amount, source = 'damage', metadata = {}) {
        if (!this.aggroTables.has(monsterId)) {
            this.aggroTables.set(monsterId, new Map());
        }
        
        const aggroTable = this.aggroTables.get(monsterId);
        const currentThreat = aggroTable.get(playerId) || 0;
        
        // Apply threat modifiers
        let modifiedAmount = this.applyThreatModifiers(amount, source, monsterId, playerId, metadata);
        
        // Apply level difference modifier
        modifiedAmount = this.applyLevelModifier(modifiedAmount, monsterId, playerId);
        
        // Apply distance modifier
        modifiedAmount = this.applyDistanceModifier(modifiedAmount, monsterId, playerId);
        
        const newThreat = currentThreat + modifiedAmount;
        aggroTable.set(playerId, newThreat);
        
        // Log aggro event
        this.logAggroEvent(monsterId, playerId, modifiedAmount, source, metadata);
        
        // Update statistics
        this.aggroStats.totalThreatGenerated += modifiedAmount;
        
        // Update monster target if needed
        this.updateMonsterTarget(monsterId);
        
        // Notify threat change
        this.notifyThreatChange(monsterId, playerId, newThreat, modifiedAmount);
        
        return newThreat;
    }
    
    removeThreat(monsterId, playerId, amount = null) {
        const aggroTable = this.aggroTables.get(monsterId);
        if (!aggroTable) return;
        
        if (amount === null) {
            // Remove all threat
            aggroTable.delete(playerId);
        } else {
            // Remove specific amount
            const currentThreat = aggroTable.get(playerId) || 0;
            const newThreat = Math.max(0, currentThreat - amount);
            
            if (newThreat === 0) {
                aggroTable.delete(playerId);
            } else {
                aggroTable.set(playerId, newThreat);
            }
        }
        
        // Update monster target
        this.updateMonsterTarget(monsterId);
    }
    
    getThreat(monsterId, playerId) {
        const aggroTable = this.aggroTables.get(monsterId);
        return aggroTable ? (aggroTable.get(playerId) || 0) : 0;
    }
    
    getHighestThreatTarget(monsterId) {
        const aggroTable = this.aggroTables.get(monsterId);
        if (!aggroTable || aggroTable.size === 0) return null;
        
        let highestThreat = 0;
        let targetId = null;
        
        for (const [playerId, threat] of aggroTable) {
            if (threat > highestThreat) {
                highestThreat = threat;
                targetId = playerId;
            }
        }
        
        return targetId;
    }
    
    getAggroList(monsterId) {
        const aggroTable = this.aggroTables.get(monsterId);
        if (!aggroTable) return [];
        
        return Array.from(aggroTable.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([playerId, threat]) => ({ playerId, threat }));
    }
    
    updateMonsterTarget(monsterId) {
        const monster = this.getMonster(monsterId);
        if (!monster) return;
        
        const behavior = this.getMonsterBehavior(monster);
        if (!behavior) return;
        
        const newTarget = this.selectTarget(monsterId, behavior);
        
        if (newTarget !== monster.target) {
            monster.target = newTarget;
            this.notifyTargetChange(monsterId, newTarget);
        }
    }
    
    selectTarget(monsterId, behavior) {
        const aggroTable = this.aggroTables.get(monsterId);
        if (!aggroTable || aggroTable.size === 0) return null;
        
        switch (behavior.targetPreference) {
            case 'highest_threat':
                return this.getHighestThreatTarget(monsterId);
                
            case 'lowest_threat':
                return this.getLowestThreatTarget(monsterId);
                
            case 'nearest':
                return this.getNearestTarget(monsterId);
                
            case 'same_target':
                return this.getSameTargetAsPack(monsterId);
                
            case 'attacking_allies':
                return this.getTargetAttackingAllies(monsterId);
                
            case 'strategic':
                return this.getStrategicTarget(monsterId);
                
            default:
                return this.getHighestThreatTarget(monsterId);
        }
    }
    
    getLowestThreatTarget(monsterId) {
        const aggroTable = this.aggroTables.get(monsterId);
        if (!aggroTable || aggroTable.size === 0) return null;
        
        let lowestThreat = Infinity;
        let targetId = null;
        
        for (const [playerId, threat] of aggroTable) {
            if (threat < lowestThreat && threat > 0) {
                lowestThreat = threat;
                targetId = playerId;
            }
        }
        
        return targetId;
    }
    
    getNearestTarget(monsterId) {
        const monster = this.getMonster(monsterId);
        if (!monster) return null;
        
        const aggroTable = this.aggroTables.get(monsterId);
        if (!aggroTable || aggroTable.size === 0) return null;
        
        let nearestDistance = Infinity;
        let targetId = null;
        
        for (const playerId of aggroTable.keys()) {
            const player = this.getPlayer(playerId);
            if (!player) continue;
            
            const distance = this.calculateDistance(monster, player);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                targetId = playerId;
            }
        }
        
        return targetId;
    }
    
    getSameTargetAsPack(monsterId) {
        const monster = this.getMonster(monsterId);
        if (!monster) return null;
        
        // Find nearby pack members
        const nearbyPack = this.getNearbyPackMembers(monsterId);
        
        // Check if any pack member has a target
        for (const packMember of nearbyPack) {
            if (packMember.target) {
                const aggroTable = this.aggroTables.get(monsterId);
                if (aggroTable && aggroTable.has(packMember.target)) {
                    return packMember.target;
                }
            }
        }
        
        // Fallback to highest threat
        return this.getHighestThreatTarget(monsterId);
    }
    
    getTargetAttackingAllies(monsterId) {
        const monster = this.getMonster(monsterId);
        if (!monster) return null;
        
        // Find nearby allies
        const nearbyAllies = this.getNearbyAllies(monsterId);
        
        // Check if any ally is being attacked
        for (const ally of nearbyAllies) {
            const allyAggroTable = this.aggroTables.get(ally.id);
            if (!allyAggroTable) continue;
            
            for (const [playerId, threat] of allyAggroTable) {
                if (threat > 0) {
                    // Add bonus threat for attacking allies
                    this.addThreat(monsterId, playerId, threat * 0.5, 'ally_defense');
                    return playerId;
                }
            }
        }
        
        // Fallback to highest threat
        return this.getHighestThreatTarget(monsterId);
    }
    
    getStrategicTarget(monsterId) {
        const monster = this.getMonster(monsterId);
        if (!monster) return null;
        
        const aggroTable = this.aggroTables.get(monsterId);
        if (!aggroTable || aggroTable.size === 0) return null;
        
        // Strategic targeting for bosses
        const candidates = [];
        
        for (const [playerId, threat] of aggroTable) {
            const player = this.getPlayer(playerId);
            if (!player) continue;
            
            // Calculate strategic score
            let score = threat;
            
            // Prefer healers
            if (this.isHealer(playerId)) {
                score *= 1.5;
            }
            
            // Prefer low health targets
            const healthPercent = player.currentHealth / player.maxHealth;
            if (healthPercent < 0.3) {
                score *= 1.3;
            }
            
            // Prefer ranged targets
            const distance = this.calculateDistance(monster, player);
            if (distance > 30) {
                score *= 1.1;
            }
            
            candidates.push({ playerId, score });
        }
        
        // Select highest strategic score
        candidates.sort((a, b) => b.score - a.score);
        return candidates.length > 0 ? candidates[0].playerId : null;
    }
    
    // Event handlers
    onDamageDealt(attackerId, targetId, damage, damageType) {
        // Only process threat for monsters taking damage
        if (!this.isMonster(targetId)) return;
        
        this.addThreat(targetId, attackerId, damage, 'damage', {
            damageType: damageType,
            timestamp: Date.now()
        });
    }
    
    onHealingDone(healerId, targetId, healing) {
        // Check if any monsters are aggroed on the healed target
        for (const [monsterId, aggroTable] of this.aggroTables) {
            if (aggroTable.has(targetId)) {
                this.addThreat(monsterId, healerId, healing * this.config.healingThreatMultiplier, 'healing', {
                    targetId: targetId,
                    healing: healing,
                    timestamp: Date.now()
                });
            }
        }
    }
    
    onStatusEffectApplied(casterId, targetId, effectId) {
        // Only process threat for monsters receiving debuffs or players receiving buffs
        const effect = this.combatSystem.statusEffects.get(effectId);
        if (!effect) return;
        
        if (this.isMonster(targetId) && effect.type === 'debuff') {
            this.addThreat(targetId, casterId, 10 * this.config.debuffThreatMultiplier, 'debuff', {
                effectId: effectId,
                timestamp: Date.now()
            });
        } else if (!this.isMonster(targetId) && effect.type === 'buff') {
            // Add threat to monsters aggroed on nearby players
            for (const [monsterId, aggroTable] of this.aggroTables) {
                const monster = this.getMonster(monsterId);
                const player = this.getPlayer(targetId);
                
                if (monster && player) {
                    const distance = this.calculateDistance(monster, player);
                    if (distance <= this.config.aggroRadius) {
                        this.addThreat(monsterId, casterId, 5 * this.config.buffThreatMultiplier, 'buff', {
                            targetId: targetId,
                            effectId: effectId,
                            timestamp: Date.now()
                        });
                    }
                }
            }
        }
    }
    
    onCombatStart(combatId, participants) {
        // Initialize aggro for monsters in combat
        for (const participant of participants) {
            if (this.isMonster(participant.id)) {
                // Find initial target based on who started combat
                const attacker = participants.find(p => p.role === 'attacker');
                if (attacker) {
                    this.addThreat(participant.id, attacker.id, 10, 'pull', {
                        combatId: combatId,
                        timestamp: Date.now()
                    });
                }
            }
        }
    }
    
    onCombatEnd(combatId) {
        // Clean up aggro tables for finished combat
        for (const [monsterId, aggroTable] of this.aggroTables) {
            // Check if monster was in this combat
            const monster = this.getMonster(monsterId);
            if (monster && monster.combatId === combatId) {
                if (this.config.resetOnDeath || monster.isDead) {
                    this.clearAggro(monsterId);
                } else if (!this.config.persistAfterCombat) {
                    this.decayAggro(monsterId, 1.0); // Complete decay
                }
            }
        }
    }
    
    onMonsterDeath(monsterId, killerId) {
        // Clear aggro for dead monster
        if (this.config.resetOnDeath) {
            this.clearAggro(monsterId);
        }
        
        // Update statistics
        if (killerId) {
            const currentKills = this.aggroStats.mostHatedPlayers.get(killerId) || 0;
            this.aggroStats.mostHatedPlayers.set(killerId, currentKills + 1);
        }
    }
    
    onPlayerMoved(playerId, x, y) {
        // Check for proximity aggro
        const player = this.getPlayer(playerId);
        if (!player) return;
        
        for (const [monsterId, monster] of this.getAllMonsters()) {
            if (monster.isDead || monster.target) continue;
            
            const distance = this.calculateDistance(
                { x: player.x, y: player.y },
                { x: monster.x, y: monster.y }
            );
            
            const behavior = this.getMonsterBehavior(monster);
            const aggroRadius = this.getAggroRadius(monster, behavior);
            
            if (distance <= aggroRadius) {
                this.addThreat(monsterId, playerId, 1, 'proximity', {
                    distance: distance,
                    timestamp: Date.now()
                });
            }
        }
    }
    
    // Update loops
    updateAggroTables() {
        const now = Date.now();
        
        for (const [monsterId, aggroTable] of this.aggroTables) {
            const monster = this.getMonster(monsterId);
            if (!monster || monster.isDead) continue;
            
            // Apply threat decay
            this.decayAggro(monsterId, this.config.aggroDecayRate);
            
            // Remove old entries
            this.removeOldThreat(monsterId, now);
            
            // Update target
            this.updateMonsterTarget(monsterId);
            
            // Check for flee behavior
            this.checkFleeBehavior(monsterId);
        }
    }
    
    checkForNewAggro() {
        // Check for monsters that should enter combat
        for (const [monsterId, monster] of this.getAllMonsters()) {
            if (monster.isDead || monster.target || monster.combatId) continue;
            
            const aggroTable = this.aggroTables.get(monsterId);
            if (aggroTable && aggroTable.size > 0) {
                // Monster has threat but no target, start combat
                const targetId = this.getHighestThreatTarget(monsterId);
                if (targetId) {
                    this.startCombatWithTarget(monsterId, targetId);
                }
            }
        }
    }
    
    processMonsterAssists() {
        const now = Date.now();
        
        for (const [monsterId, monster] of this.getAllMonsters()) {
            if (monster.isDead) continue;
            
            const behavior = this.getMonsterBehavior(monster);
            if (!behavior || !behavior.callForHelp) continue;
            
            // Check assist cooldown
            const lastAssist = this.assistCooldowns.get(monsterId) || 0;
            if (now - lastAssist < 10000) continue; // 10 second cooldown
            
            // Check if monster needs help
            if (this.needsAssistance(monsterId)) {
                this.callForAssistance(monsterId);
                this.assistCooldowns.set(monsterId, now);
            }
        }
    }
    
    // Utility methods
    applyThreatModifiers(amount, source, monsterId, playerId, metadata) {
        const modifier = this.threatModifiers.get(source);
        if (!modifier) return amount;
        
        let modifiedAmount = amount * modifier.base;
        
        // Apply monster-specific multiplier
        const monster = this.getMonster(monsterId);
        if (monster) {
            const behavior = this.getMonsterBehavior(monster);
            if (behavior) {
                modifiedAmount *= behavior.threatMultiplier;
            }
        }
        
        return modifiedAmount;
    }
    
    applyLevelModifier(amount, monsterId, playerId) {
        const monster = this.getMonster(monsterId);
        const player = this.getPlayer(playerId);
        
        if (!monster || !player) return amount;
        
        const levelDiff = player.level - monster.level;
        const modifier = 1 + (levelDiff * this.config.levelDiffThreatModifier);
        
        return amount * modifier;
    }
    
    applyDistanceModifier(amount, monsterId, playerId) {
        const monster = this.getMonster(monsterId);
        const player = this.getPlayer(playerId);
        
        if (!monster || !player) return amount;
        
        const distance = this.calculateDistance(monster, player);
        
        if (distance > 30) {
            // Ranged
            return amount * this.config.rangedThreatMultiplier;
        } else {
            // Melee
            return amount * this.config.meleeThreatMultiplier;
        }
    }
    
    decayAggro(monsterId, decayRate) {
        const aggroTable = this.aggroTables.get(monsterId);
        if (!aggroTable) return;
        
        for (const [playerId, threat] of aggroTable) {
            const newThreat = threat * decayRate;
            if (newThreat < 0.1) {
                aggroTable.delete(playerId);
            } else {
                aggroTable.set(playerId, newThreat);
            }
        }
    }
    
    removeOldThreat(monsterId, now) {
        const aggroTable = this.aggroTables.get(monsterId);
        if (!aggroTable) return;
        
        const toRemove = [];
        
        for (const [playerId, threat] of aggroTable) {
            const history = this.aggroHistory.get(monsterId);
            if (history) {
                const lastEvent = history[history.length - 1];
                if (lastEvent && (now - lastEvent.timestamp) > this.config.aggroMemoryDuration) {
                    toRemove.push(playerId);
                }
            }
        }
        
        for (const playerId of toRemove) {
            aggroTable.delete(playerId);
        }
    }
    
    checkFleeBehavior(monsterId) {
        const monster = this.getMonster(monsterId);
        if (!monster) return;
        
        const behavior = this.getMonsterBehavior(monster);
        if (!behavior || behavior.fleeThreshold === 0) return;
        
        const healthPercent = monster.currentHealth / monster.maxHealth;
        if (healthPercent <= behavior.fleeThreshold) {
            this.attemptFlee(monsterId);
        }
    }
    
    needsAssistance(monsterId) {
        const monster = this.getMonster(monsterId);
        if (!monster) return false;
        
        // Check if health is low
        const healthPercent = monster.currentHealth / monster.maxHealth;
        if (healthPercent < 0.5) return true;
        
        // Check if outnumbered
        const aggroTable = this.aggroTables.get(monsterId);
        if (aggroTable && aggroTable.size >= 3) return true;
        
        return false;
    }
    
    callForAssistance(monsterId) {
        const monster = this.getMonster(monsterId);
        if (!monster) return;
        
        const nearbyMonsters = this.getNearbyMonsters(monsterId, this.config.assistRadius);
        
        for (const nearbyMonster of nearbyMonsters) {
            if (nearbyMonster.isDead || nearbyMonster.target) continue;
            
            const behavior = this.getMonsterBehavior(nearbyMonster);
            if (!behavior || behavior.assistChance < Math.random()) continue;
            
            // Transfer some threat to assisting monster
            const aggroTable = this.aggroTables.get(monsterId);
            if (aggroTable) {
                for (const [playerId, threat] of aggroTable) {
                    this.addThreat(nearbyMonster.id, playerId, threat * 0.3, 'assist', {
                        assistedMonster: monsterId,
                        timestamp: Date.now()
                    });
                }
            }
            
            this.aggroStats.totalAssists++;
        }
    }
    
    startCombatWithTarget(monsterId, targetId) {
        const combatId = this.combatSystem.initiateCombat(monsterId, targetId);
        if (combatId) {
            const monster = this.getMonster(monsterId);
            if (monster) {
                monster.combatId = combatId;
            }
        }
    }
    
    attemptFlee(monsterId) {
        const monster = this.getMonster(monsterId);
        if (!monster) return;
        
        // Simple flee logic - move away from highest threat target
        const targetId = this.getHighestThreatTarget(monsterId);
        if (!targetId) return;
        
        const target = this.getPlayer(targetId);
        if (!target) return;
        
        // Calculate flee direction
        const dx = monster.x - target.x;
        const dy = monster.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const fleeX = monster.x + (dx / distance) * 20;
            const fleeY = monster.y + (dy / distance) * 20;
            
            // Move monster (simplified)
            monster.x = fleeX;
            monster.y = fleeY;
            
            // Clear aggro and flee
            this.clearAggro(monsterId);
            monster.hasFled = true;
            
            // Notify flee
            this.notifyMonsterFlee(monsterId);
        }
    }
    
    // Helper methods
    getMonster(monsterId) {
        for (const region of this.worldManager.regions.values()) {
            const monster = region.monsters.get(monsterId);
            if (monster) return monster;
        }
        return null;
    }
    
    getPlayer(playerId) {
        return this.worldManager.connectedPlayers.get(playerId);
    }
    
    getAllMonsters() {
        const monsters = new Map();
        
        for (const region of this.worldManager.regions.values()) {
            for (const [monsterId, monster] of region.monsters) {
                monsters.set(monsterId, monster);
            }
        }
        
        return monsters;
    }
    
    isMonster(entityId) {
        return this.getMonster(entityId) !== null;
    }
    
    getMonsterBehavior(monster) {
        if (!monster.behavior) return null;
        return this.monsterBehaviors.get(monster.behavior);
    }
    
    getAggroRadius(monster, behavior) {
        const baseRadius = behavior ? behavior.aggroRadius : 1.0;
        return this.config.baseAggroRadius * baseRadius;
    }
    
    getNearbyMonsters(monsterId, radius) {
        const monster = this.getMonster(monsterId);
        if (!monster) return [];
        
        const nearby = [];
        
        for (const [otherId, otherMonster] of this.getAllMonsters()) {
            if (otherId === monsterId || otherMonster.isDead) continue;
            
            const distance = this.calculateDistance(monster, otherMonster);
            if (distance <= radius) {
                nearby.push(otherMonster);
            }
        }
        
        return nearby;
    }
    
    getNearbyPackMembers(monsterId) {
        const monster = this.getMonster(monsterId);
        if (!monster || monster.behavior !== 'pack_hunter') return [];
        
        return this.getNearbyMonsters(monsterId, this.config.assistRadius)
            .filter(m => m.behavior === 'pack_hunter');
    }
    
    getNearbyAllies(monsterId) {
        const monster = this.getMonster(monsterId);
        if (!monster) return [];
        
        return this.getNearbyMonsters(monsterId, this.config.assistRadius)
            .filter(m => m.type === monster.type);
    }
    
    isHealer(playerId) {
        const player = this.getPlayer(playerId);
        if (!player) return false;
        
        // Simple check - could be expanded based on class/skills
        return player.className === 'Cleric' || player.className === 'Druid';
    }
    
    calculateDistance(entity1, entity2) {
        const dx = entity1.x - entity2.x;
        const dy = entity1.y - entity2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    clearAggro(monsterId) {
        this.aggroTables.delete(monsterId);
        this.aggroHistory.delete(monsterId);
        
        const monster = this.getMonster(monsterId);
        if (monster) {
            monster.target = null;
        }
    }
    
    // Logging
    logAggroEvent(monsterId, playerId, amount, source, metadata) {
        if (!this.aggroHistory.has(monsterId)) {
            this.aggroHistory.set(monsterId, []);
        }
        
        const history = this.aggroHistory.get(monsterId);
        history.push({
            playerId: playerId,
            amount: amount,
            source: source,
            metadata: metadata,
            timestamp: Date.now()
        });
        
        // Keep only last 50 events
        if (history.length > 50) {
            history.splice(0, history.length - 50);
        }
        
        this.aggroStats.totalAggroEvents++;
    }
    
    // Notification methods
    notifyThreatChange(monsterId, playerId, newThreat, amount) {
        const monster = this.getMonster(monsterId);
        if (!monster) return;
        
        // Notify players in combat
        if (monster.combatId) {
            const combat = this.combatSystem.activeCombats.get(monster.combatId);
            if (combat) {
                for (const [participantId, participant] of combat.participants) {
                    if (participant.type === 'player') {
                        this.worldManager.sendToPlayer(participantId, {
                            type: 'threat_change',
                            monsterId: monsterId,
                            monsterName: monster.name,
                            playerId: playerId,
                            threat: newThreat,
                            amount: amount,
                            isHighest: this.getHighestThreatTarget(monsterId) === playerId
                        });
                    }
                }
            }
        }
    }
    
    notifyTargetChange(monsterId, newTarget) {
        const monster = this.getMonster(monsterId);
        if (!monster) return;
        
        // Notify players about target change
        if (monster.combatId) {
            const combat = this.combatSystem.activeCombats.get(monster.combatId);
            if (combat) {
                for (const [participantId, participant] of combat.participants) {
                    if (participant.type === 'player') {
                        this.worldManager.sendToPlayer(participantId, {
                            type: 'target_change',
                            monsterId: monsterId,
                            monsterName: monster.name,
                            newTarget: newTarget,
                            isTargetingMe: newTarget === participantId
                        });
                    }
                }
            }
        }
    }
    
    notifyMonsterFlee(monsterId) {
        const monster = this.getMonster(monsterId);
        if (!monster) return;
        
        // Notify nearby players
        const region = this.worldManager.regions.get(monster.regionId);
        if (region) {
            for (const playerId of region.players) {
                this.worldManager.sendToPlayer(playerId, {
                    type: 'monster_flee',
                    monsterId: monsterId,
                    monsterName: monster.name,
                    message: `${monster.name} fugiu em pânico!`
                });
            }
        }
    }
    
    // Public API
    getAggroTable(monsterId) {
        return this.aggroTables.get(monsterId);
    }
    
    getAggroHistory(monsterId) {
        return this.aggroHistory.get(monsterId);
    }
    
    getAggroStatistics() {
        return this.aggroStats;
    }
    
    resetAggro(monsterId) {
        this.clearAggro(monsterId);
    }
    
    // Cleanup
    cleanup() {
        this.aggroTables.clear();
        this.aggroHistory.clear();
        this.assistCooldowns.clear();
        this.threatModifiers.clear();
        this.monsterBehaviors.clear();
    }
}

export default AggroSystem;
