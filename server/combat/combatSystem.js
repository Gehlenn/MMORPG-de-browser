/**
 * Combat System - Battle Mechanics and Damage Calculation
 * Handles all combat interactions, damage calculations, and combat flow
 * Version 0.3 - Complete Architecture Integration
 */

class CombatSystem {
    constructor(worldManager, database) {
        this.worldManager = worldManager;
        this.database = database;
        
        // Combat configuration
        this.config = {
            baseAccuracy: 0.85, // 85% base hit chance
            critMultiplier: 2.0,
            critChance: 0.05, // 5% base crit chance
            dodgeChance: 0.10, // 10% base dodge chance
            blockChance: 0.15, // 15% base block chance
            parryChance: 0.05, // 5% base parry chance
            
            // Damage formulas
            damageVariance: 0.2, // ±20% damage variance
            levelScaling: 1.1, // 10% damage increase per level
            defenseScaling: 0.5, // Defense reduces damage by 50%
            
            // Combat timing
            globalCooldown: 1500, // 1.5 seconds
            autoAttackSpeed: 2000, // 2 seconds
            spellCastTimes: {
                instant: 0,
                fast: 1000,
                normal: 2000,
                long: 3000
            },
            
            // Combat rules
            maxCombatRange: 100,
            minCombatRange: 5,
            fleeChance: 0.3, // 30% chance to flee
            deathPenalty: 0.1, // 10% XP loss on death
            
            // PvP settings
            pvpEnabled: true,
            pvpLevelDiff: 10, // Max level difference for PvP
            safeZones: ['town', 'sanctuary', 'shrine']
        };
        
        // Active combat instances
        this.activeCombats = new Map();
        this.combatQueue = [];
        
        // Combat statistics
        this.combatStats = {
            totalCombats: 0,
            totalDamage: 0,
            totalKills: 0,
            totalDeaths: 0,
            averageCombatDuration: 0
        };
        
        // Damage formulas and modifiers
        this.damageFormulas = {
            physical: (attacker, defender, skill) => this.calculatePhysicalDamage(attacker, defender, skill),
            magical: (attacker, defender, skill) => this.calculateMagicalDamage(attacker, defender, skill),
            true: (attacker, defender, skill) => this.calculateTrueDamage(attacker, defender, skill),
            poison: (attacker, defender, skill) => this.calculatePoisonDamage(attacker, defender, skill),
            fire: (attacker, defender, skill) => this.calculateElementalDamage(attacker, defender, skill, 'fire'),
            ice: (attacker, defender, skill) => this.calculateElementalDamage(attacker, defender, skill, 'ice'),
            lightning: (attacker, defender, skill) => this.calculateElementalDamage(attacker, defender, skill, 'lightning')
        };
        
        // Status effects
        this.statusEffects = new Map();
        this.activeStatusEffects = new Map();
        
        // Combat statistics
        this.combatStats = {
            totalCombats: 0,
            playerDeaths: 0,
            monsterDeaths: 0,
            totalDamageDealt: 0,
            totalDamageTaken: 0,
            criticalHits: 0,
            dodges: 0,
            blocks: 0
        };
        
        // Initialize
        this.initialize();
    }
    
    async initialize() {
        // Load combat configuration
        await this.loadCombatConfig();
        
        // Setup combat loops
        this.setupCombatLoops();
        
        // Initialize status effects
        this.initializeStatusEffects();
        
        console.log('Combat System initialized');
    }
    
    async loadCombatConfig() {
        try {
            // Simplified combat config loading
            console.log('Loading combat config...');
        } catch (error) {
            console.error('Error loading combat config:', error);
        }
    }
    
    setupCombatLoops() {
        // Main combat update loop
        setInterval(() => {
            this.updateActiveCombats();
        }, 100); // Update every 100ms
        
        // Status effect update loop
        setInterval(() => {
            this.updateStatusEffects();
        }, 1000); // Update every second
        
        // Combat cleanup loop
        setInterval(() => {
            this.cleanupFinishedCombats();
        }, 5000); // Check every 5 seconds
    }
    
    initializeStatusEffects() {
        // Damage over time effects
        this.statusEffects.set('burn', {
            name: 'Queimando',
            type: 'dot',
            damage: 10,
            interval: 1000,
            duration: 5000,
            stackable: true,
            maxStacks: 5,
            icon: '🔥',
            color: '#ff6b6b'
        });
        
        this.statusEffects.set('poison', {
            name: 'Envenenado',
            type: 'dot',
            damage: 8,
            interval: 1000,
            duration: 8000,
            stackable: true,
            maxStacks: 3,
            icon: '☠️',
            color: '#9b59b6'
        });
        
        this.statusEffects.set('bleed', {
            name: 'Sangrando',
            type: 'dot',
            damage: 15,
            interval: 1000,
            duration: 6000,
            stackable: false,
            maxStacks: 1,
            icon: '🩸',
            color: '#e74c3c'
        });
        
        // Buffs
        this.statusEffects.set('strength', {
            name: 'Força Aumentada',
            type: 'buff',
            statModifier: { attack: 20 },
            duration: 30000,
            stackable: false,
            icon: '💪',
            color: '#f39c12'
        });
        
        this.statusEffects.set('protection', {
            name: 'Proteção',
            type: 'buff',
            statModifier: { defense: 30 },
            duration: 20000,
            stackable: false,
            icon: '🛡️',
            color: '#3498db'
        });
        
        this.statusEffects.set('haste', {
            name: 'Aceleração',
            type: 'buff',
            statModifier: { speed: 50 },
            duration: 15000,
            stackable: false,
            icon: '⚡',
            color: '#2ecc71'
        });
        
        // Debuffs
        this.statusEffects.set('weakness', {
            name: 'Fraqueza',
            type: 'debuff',
            statModifier: { attack: -30 },
            duration: 10000,
            stackable: false,
            icon: '😓',
            color: '#95a5a6'
        });
        
        this.statusEffects.set('slow', {
            name: 'Lentidão',
            type: 'debuff',
            statModifier: { speed: -50 },
            duration: 8000,
            stackable: false,
            icon: '🐌',
            color: '#7f8c8d'
        });
        
        this.statusEffects.set('stun', {
            name: 'Atordoado',
            type: 'control',
            duration: 2000,
            stackable: false,
            preventsAction: true,
            icon: '😵',
            color: '#34495e'
        });
        
        // Healing effects
        this.statusEffects.set('regeneration', {
            name: 'Regeneração',
            type: 'hot',
            healing: 5,
            interval: 1000,
            duration: 10000,
            stackable: false,
            icon: '💚',
            color: '#27ae60'
        });
    }
    
    // Main combat methods
    initiateCombat(attackerId, defenderId) {
        const combatId = `combat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const combat = {
            id: combatId,
            participants: new Map(),
            startTime: Date.now(),
            lastUpdate: Date.now(),
            turnOrder: [],
            currentTurn: 0,
            state: 'active',
            
            // Combat settings
            isPvP: false,
            isDuel: false,
            maxDuration: 300000, // 5 minutes
            
            // Combat events
            events: [],
            damageLog: []
        };
        
        // Add participants
        this.addCombatParticipant(combat, attackerId, 'attacker');
        this.addCombatParticipant(combat, defenderId, 'defender');
        
        // Determine if it's PvP
        const attacker = this.getEntity(attackerId);
        const defender = this.getEntity(defenderId);
        
        if (attacker && defender) {
            combat.isPvP = attacker.type === 'player' && defender.type === 'player';
            
            // Check if combat is allowed
            if (!this.isCombatAllowed(attacker, defender)) {
                return null;
            }
        }
        
        // Initialize combat
        this.activeCombats.set(combatId, combat);
        
        // Set initial turn order
        this.determineTurnOrder(combat);
        
        // Start combat
        this.startCombat(combatId);
        
        // Notify participants
        this.notifyCombatStart(combat);
        
        console.log(`Combat initiated: ${attackerId} vs ${defenderId}`);
        return combatId;
    }
    
    addCombatParticipant(combat, entityId, role) {
        const entity = this.getEntity(entityId);
        if (!entity) return;
        
        const participant = {
            id: entityId,
            type: entity.type || 'unknown',
            name: entity.name || 'Unknown',
            level: entity.level || 1,
            role: role,
            
            // Combat stats
            maxHealth: entity.maxHealth || 100,
            currentHealth: entity.currentHealth || entity.health || 100,
            maxMana: entity.maxMana || 50,
            currentMana: entity.currentMana || entity.mana || 50,
            attack: entity.attack || 10,
            defense: entity.defense || 5,
            speed: entity.speed || 1.0,
            accuracy: entity.accuracy || this.config.baseAccuracy,
            critChance: entity.critChance || this.config.critChance,
            dodgeChance: entity.dodgeChance || this.config.dodgeChance,
            
            // Combat state
            position: { x: entity.x || 0, y: entity.y || 0 },
            target: null,
            lastAction: 0,
            globalCooldown: 0,
            statusEffects: new Map(),
            isDead: false,
            hasFled: false,
            
            // Statistics
            damageDealt: 0,
            damageTaken: 0,
            healingDone: 0,
            criticalHits: 0,
            dodges: 0,
            blocks: 0
        };
        
        combat.participants.set(entityId, participant);
        
        // Update entity reference
        if (entity.type === 'player') {
            entity.combatId = combat.id;
        }
    }
    
    determineTurnOrder(combat) {
        const participants = Array.from(combat.participants.values());
        
        // Sort by speed (descending)
        participants.sort((a, b) => b.speed - a.speed);
        
        combat.turnOrder = participants.map(p => p.id);
        combat.currentTurn = 0;
    }
    
    startCombat(combatId) {
        const combat = this.activeCombats.get(combatId);
        if (!combat) return;
        
        // Set initial targets
        for (const participant of combat.participants.values()) {
            if (participant.role === 'attacker') {
                participant.target = this.findOpponent(combat, participant.id);
            } else if (participant.role === 'defender') {
                participant.target = this.findOpponent(combat, participant.id);
            }
        }
        
        // Start first turn
        this.startTurn(combatId, combat.turnOrder[0]);
    }
    
    startTurn(combatId, participantId) {
        const combat = this.activeCombats.get(combatId);
        const participant = combat.participants.get(participantId);
        
        if (!participant || participant.isDead || participant.hasFled) {
            this.nextTurn(combatId);
            return;
        }
        
        // Notify turn start
        this.notifyTurnStart(combat, participant);
        
        // Execute AI turn for monsters
        if (participant.type === 'monster') {
            this.executeAITurn(combatId, participantId);
        }
    }
    
    executeAITurn(combatId, participantId) {
        const combat = this.activeCombats.get(combatId);
        const participant = combat.participants.get(participantId);
        
        if (!participant || !participant.target) return;
        
        // Simple AI: basic attack
        setTimeout(() => {
            this.performAction(combatId, participantId, {
                type: 'attack',
                targetId: participant.target,
                skill: 'basic_attack'
            });
        }, 1000);
    }
    
    performAction(combatId, attackerId, action) {
        const combat = this.activeCombats.get(combatId);
        const attacker = combat.participants.get(attackerId);
        
        if (!attacker || attacker.isDead || attacker.hasFled) {
            return;
        }
        
        // Check cooldowns
        const now = Date.now();
        if (attacker.globalCooldown > now) {
            return;
        }
        
        // Check if stunned
        if (this.hasStatusEffect(attackerId, 'stun')) {
            return;
        }
        
        const target = combat.participants.get(action.targetId);
        if (!target || target.isDead || target.hasFled) {
            return;
        }
        
        // Execute action based on type
        switch (action.type) {
            case 'attack':
                this.executeAttack(combatId, attackerId, action);
                break;
            case 'skill':
                this.executeSkill(combatId, attackerId, action);
                break;
            case 'spell':
                this.executeSpell(combatId, attackerId, action);
                break;
            case 'item':
                this.executeItem(combatId, attackerId, action);
                break;
            case 'flee':
                this.executeFlee(combatId, attackerId);
                break;
        }
        
        // Set global cooldown
        attacker.globalCooldown = now + this.config.globalCooldown;
        attacker.lastAction = now;
        
        // Next turn after delay
        setTimeout(() => {
            this.nextTurn(combatId);
        }, 500);
    }
    
    executeAttack(combatId, attackerId, action) {
        const combat = this.activeCombats.get(combatId);
        const attacker = combat.participants.get(attackerId);
        const target = combat.participants.get(action.targetId);
        
        if (!attacker || !target) return;
        
        // Calculate hit chance
        const hitChance = this.calculateHitChance(attacker, target);
        
        if (Math.random() > hitChance) {
            // Miss
            this.logCombatEvent(combat, {
                type: 'miss',
                attacker: attackerId,
                target: action.targetId,
                message: `${attacker.name} errou o ataque em ${target.name}!`
            });
            
            this.notifyCombatEvent(combat, 'miss', {
                attacker: attacker.name,
                target: target.name
            });
            
            return;
        }
        
        // Check for dodge
        if (this.checkDodge(attacker, target)) {
            this.logCombatEvent(combat, {
                type: 'dodge',
                attacker: attackerId,
                target: action.targetId,
                message: `${target.name} desviou do ataque de ${attacker.name}!`
            });
            
            target.dodges++;
            this.notifyCombatEvent(combat, 'dodge', {
                attacker: attacker.name,
                target: target.name
            });
            
            return;
        }
        
        // Check for block
        const blocked = this.checkBlock(attacker, target);
        
        // Calculate damage
        const damage = this.calculatePhysicalDamage(attacker, target, action.skill);
        const finalDamage = blocked ? Math.floor(damage * 0.5) : damage;
        
        // Apply damage
        this.applyDamage(combatId, action.targetId, finalDamage, 'physical', attackerId);
        
        // Log event
        const eventType = blocked ? 'block' : 'hit';
        this.logCombatEvent(combat, {
            type: eventType,
            attacker: attackerId,
            target: action.targetId,
            damage: finalDamage,
            message: `${attacker.name} atacou ${target.name} por ${finalDamage} de dano${blocked ? ' (bloqueado)' : ''}!`
        });
        
        // Update statistics
        attacker.damageDealt += finalDamage;
        target.damageTaken += finalDamage;
        if (blocked) target.blocks++;
        
        // Notify participants
        this.notifyCombatEvent(combat, eventType, {
            attacker: attacker.name,
            target: target.name,
            damage: finalDamage,
            blocked: blocked
        });
    }
    
    executeSkill(combatId, attackerId, action) {
        const combat = this.activeCombats.get(combatId);
        const attacker = combat.participants.get(attackerId);
        const target = combat.participants.get(action.targetId);
        
        if (!attacker || !target) return;
        
        // Get skill data
        const skill = this.getSkillData(action.skill);
        if (!skill) return;
        
        // Check resources
        if (!this.checkResourceCost(attacker, skill)) {
            return;
        }
        
        // Consume resources
        this.consumeResourceCost(attacker, skill);
        
        // Execute skill effects
        for (const effect of skill.effects) {
            this.applySkillEffect(combatId, attackerId, action.targetId, effect);
        }
        
        // Log event
        this.logCombatEvent(combat, {
            type: 'skill',
            attacker: attackerId,
            target: action.targetId,
            skill: action.skill,
            message: `${attacker.name} usou ${skill.name} em ${target.name}!`
        });
        
        // Notify participants
        this.notifyCombatEvent(combat, 'skill', {
            attacker: attacker.name,
            target: target.name,
            skill: skill.name
        });
    }
    
    executeSpell(combatId, attackerId, action) {
        const combat = this.activeCombats.get(combatId);
        const attacker = combat.participants.get(attackerId);
        const target = combat.participants.get(action.targetId);
        
        if (!attacker || !target) return;
        
        // Get spell data
        const spell = this.getSpellData(action.spell);
        if (!spell) return;
        
        // Check mana cost
        if (attacker.currentMana < spell.manaCost) {
            return;
        }
        
        // Consume mana
        attacker.currentMana -= spell.manaCost;
        
        // Cast time (simplified)
        setTimeout(() => {
            // Apply spell effects
            for (const effect of spell.effects) {
                this.applySpellEffect(combatId, attackerId, action.targetId, effect);
            }
            
            // Log event
            this.logCombatEvent(combat, {
                type: 'spell',
                attacker: attackerId,
                target: action.targetId,
                spell: action.spell,
                message: `${attacker.name} lançou ${spell.name} em ${target.name}!`
            });
            
            // Notify participants
            this.notifyCombatEvent(combat, 'spell', {
                attacker: attacker.name,
                target: target.name,
                spell: spell.name
            });
        }, spell.castTime || 0);
    }
    
    executeFlee(combatId, participantId) {
        const combat = this.activeCombats.get(combatId);
        const participant = combat.participants.get(participantId);
        
        if (!participant) return;
        
        // Calculate flee chance
        const fleeChance = this.calculateFleeChance(participant);
        
        if (Math.random() < fleeChance) {
            // Successful flee
            participant.hasFled = true;
            
            this.logCombatEvent(combat, {
                type: 'flee',
                participant: participantId,
                message: `${participant.name} fugiu da batalha!`
            });
            
            this.notifyCombatEvent(combat, 'flee', {
                participant: participant.name
            });
            
            // Check if combat should end
            this.checkCombatEnd(combatId);
        } else {
            // Failed flee
            this.logCombatEvent(combat, {
                type: 'flee_failed',
                participant: participantId,
                message: `${participant.name} tentou fugir, mas não conseguiu!`
            });
            
            this.notifyCombatEvent(combat, 'flee_failed', {
                participant: participant.name
            });
        }
    }
    
    // Damage calculation methods
    calculatePhysicalDamage(attacker, defender, skill) {
        const baseDamage = attacker.attack || 10;
        const defense = defender.defense || 5;
        
        // Level scaling
        const levelMultiplier = Math.pow(this.config.levelScaling, attacker.level - 1);
        
        // Calculate base damage
        let damage = baseDamage * levelMultiplier;
        
        // Apply defense reduction
        const defenseReduction = defense * this.config.defenseScaling;
        damage = Math.max(1, damage - defenseReduction);
        
        // Apply damage variance
        const variance = 1 + (Math.random() - 0.5) * this.config.damageVariance * 2;
        damage *= variance;
        
        // Check for critical hit
        const critChance = attacker.critChance || this.config.critChance;
        if (Math.random() < critChance) {
            damage *= this.config.critMultiplier;
            attacker.criticalHits++;
        }
        
        return Math.floor(damage);
    }
    
    calculateMagicalDamage(attacker, defender, skill) {
        const baseDamage = attacker.magicAttack || attacker.attack || 10;
        const magicDefense = defender.magicDefense || defender.defense || 5;
        
        // Level scaling
        const levelMultiplier = Math.pow(this.config.levelScaling, attacker.level - 1);
        
        // Calculate base damage
        let damage = baseDamage * levelMultiplier;
        
        // Apply magic defense reduction
        const defenseReduction = magicDefense * this.config.defenseScaling;
        damage = Math.max(1, damage - defenseReduction);
        
        // Apply damage variance
        const variance = 1 + (Math.random() - 0.5) * this.config.damageVariance * 2;
        damage *= variance;
        
        return Math.floor(damage);
    }
    
    calculateTrueDamage(attacker, defender, skill) {
        // True damage ignores defense
        const baseDamage = attacker.attack || 10;
        
        // Level scaling
        const levelMultiplier = Math.pow(this.config.levelScaling, attacker.level - 1);
        
        // Calculate damage
        let damage = baseDamage * levelMultiplier;
        
        // Apply damage variance
        const variance = 1 + (Math.random() - 0.5) * this.config.damageVariance * 2;
        damage *= variance;
        
        return Math.floor(damage);
    }
    
    calculatePoisonDamage(attacker, defender, skill) {
        // Poison damage based on attacker level
        const basePoisonDamage = 5 + attacker.level * 2;
        
        // Apply variance
        const variance = 1 + (Math.random() - 0.5) * 0.3; // ±15% variance
        const damage = basePoisonDamage * variance;
        
        return Math.floor(damage);
    }
    
    calculateElementalDamage(attacker, defender, skill, element) {
        const baseDamage = attacker.magicAttack || attacker.attack || 10;
        const magicDefense = defender.magicDefense || defender.defense || 5;
        
        // Level scaling
        const levelMultiplier = Math.pow(this.config.levelScaling, attacker.level - 1);
        
        // Calculate base damage
        let damage = baseDamage * levelMultiplier;
        
        // Apply magic defense reduction
        const defenseReduction = magicDefense * this.config.defenseScaling;
        damage = Math.max(1, damage - defenseReduction);
        
        // Elemental effectiveness (simplified)
        const effectiveness = this.getElementalEffectiveness(element, defender);
        damage *= effectiveness;
        
        // Apply damage variance
        const variance = 1 + (Math.random() - 0.5) * this.config.damageVariance * 2;
        damage *= variance;
        
        return Math.floor(damage);
    }
    
    // Combat utility methods
    calculateHitChance(attacker, defender) {
        let accuracy = attacker.accuracy || this.config.baseAccuracy;
        const levelDiff = attacker.level - defender.level;
        
        // Level difference modifier
        accuracy += levelDiff * 0.02; // ±2% per level difference
        
        // Status effect modifiers
        if (this.hasStatusEffect(attacker.id, 'weakness')) {
            accuracy -= 0.1; // -10% accuracy when weak
        }
        
        if (this.hasStatusEffect(defender.id, 'haste')) {
            accuracy -= 0.15; // -15% accuracy when target has haste
        }
        
        return Math.max(0.1, Math.min(0.95, accuracy));
    }
    
    checkDodge(attacker, defender) {
        let dodgeChance = defender.dodgeChance || this.config.dodgeChance;
        
        // Level difference modifier
        const levelDiff = defender.level - attacker.level;
        dodgeChance += levelDiff * 0.01; // ±1% per level difference
        
        // Status effect modifiers
        if (this.hasStatusEffect(defender.id, 'haste')) {
            dodgeChance += 0.2; // +20% dodge with haste
        }
        
        if (this.hasStatusEffect(defender.id, 'slow')) {
            dodgeChance -= 0.15; // -15% dodge when slowed
        }
        
        return Math.random() < Math.max(0.05, Math.min(0.8, dodgeChance));
    }
    
    checkBlock(attacker, defender) {
        let blockChance = defender.blockChance || this.config.blockChance;
        
        // Level difference modifier
        const levelDiff = defender.level - attacker.level;
        blockChance += levelDiff * 0.01; // ±1% per level difference
        
        // Status effect modifiers
        if (this.hasStatusEffect(defender.id, 'protection')) {
            blockChance += 0.25; // +25% block with protection
        }
        
        return Math.random() < Math.max(0.05, Math.min(0.7, blockChance));
    }
    
    calculateFleeChance(participant) {
        let fleeChance = this.config.fleeChance;
        
        // Health modifier - easier to flee when low health
        const healthPercent = participant.currentHealth / participant.maxHealth;
        if (healthPercent < 0.3) {
            fleeChance += 0.2; // +20% when below 30% health
        } else if (healthPercent < 0.5) {
            fleeChance += 0.1; // +10% when below 50% health
        }
        
        // Level modifier
        const opponents = this.getOpponents(participant);
        for (const opponent of opponents) {
            const levelDiff = opponent.level - participant.level;
            if (levelDiff > 5) {
                fleeChance -= 0.1; // -10% if opponent is much higher level
            } else if (levelDiff < -5) {
                fleeChance += 0.1; // +10% if opponent is much lower level
            }
        }
        
        return Math.max(0.05, Math.min(0.8, fleeChance));
    }
    
    getElementalEffectiveness(element, defender) {
        // Simplified elemental effectiveness
        const effectiveness = {
            fire: { weak: 'ice', strong: 'nature', multiplier: 1.0 },
            ice: { weak: 'fire', strong: 'nature', multiplier: 1.0 },
            lightning: { weak: 'earth', strong: 'water', multiplier: 1.0 },
            earth: { weak: 'lightning', strong: 'fire', multiplier: 1.0 },
            water: { weak: 'nature', strong: 'fire', multiplier: 1.0 },
            nature: { weak: 'water', strong: 'ice', multiplier: 1.0 }
        };
        
        const elementData = effectiveness[element];
        if (!elementData) return 1.0;
        
        // Check defender's weaknesses and resistances
        // This would be expanded based on defender's attributes
        return elementData.multiplier;
    }
    
    // Status effect management
    applyStatusEffect(targetId, effectId, duration = null, stacks = 1) {
        const effect = this.statusEffects.get(effectId);
        if (!effect) return;
        
        if (!this.activeStatusEffects.has(targetId)) {
            this.activeStatusEffects.set(targetId, new Map());
        }
        
        const targetEffects = this.activeStatusEffects.get(targetId);
        
        if (targetEffects.has(effectId)) {
            // Update existing effect
            const existingEffect = targetEffects.get(effectId);
            
            if (effect.stackable) {
                existingEffect.stacks = Math.min(effect.maxStacks, existingEffect.stacks + stacks);
            }
            
            existingEffect.endTime = Date.now() + (duration || effect.duration);
            existingEffect.lastTick = Date.now();
        } else {
            // Apply new effect
            targetEffects.set(effectId, {
                ...effect,
                startTime: Date.now(),
                endTime: Date.now() + (duration || effect.duration),
                lastTick: Date.now(),
                stacks: stacks
            });
        }
        
        // Apply stat modifiers immediately
        if (effect.statModifier) {
            this.applyStatModifier(targetId, effect.statModifier, effect.type === 'buff');
        }
        
        // Notify target
        this.notifyStatusEffectApplied(targetId, effectId, stacks);
    }
    
    removeStatusEffect(targetId, effectId) {
        const targetEffects = this.activeStatusEffects.get(targetId);
        if (!targetEffects || !targetEffects.has(effectId)) return;
        
        const effect = targetEffects.get(effectId);
        
        // Remove stat modifiers
        if (effect.statModifier) {
            this.removeStatModifier(targetId, effect.statModifier);
        }
        
        targetEffects.delete(effectId);
        
        // Notify target
        this.notifyStatusEffectRemoved(targetId, effectId);
    }
    
    hasStatusEffect(targetId, effectId) {
        const targetEffects = this.activeStatusEffects.get(targetId);
        return targetEffects && targetEffects.has(effectId);
    }
    
    updateStatusEffects() {
        const now = Date.now();
        
        for (const [targetId, effects] of this.activeStatusEffects) {
            for (const [effectId, effect] of effects) {
                // Check if effect has expired
                if (now >= effect.endTime) {
                    this.removeStatusEffect(targetId, effectId);
                    continue;
                }
                
                // Process damage/healing over time
                if ((effect.type === 'dot' || effect.type === 'hot') && 
                    now - effect.lastTick >= effect.interval) {
                    
                    const target = this.getEntity(targetId);
                    if (target) {
                        if (effect.type === 'dot') {
                            const damage = effect.damage * effect.stacks;
                            this.applyDamage(null, targetId, damage, effectId);
                        } else if (effect.type === 'hot') {
                            const healing = effect.healing * effect.stacks;
                            this.applyHealing(targetId, healing);
                        }
                    }
                    
                    effect.lastTick = now;
                }
            }
        }
    }
    
    // Damage and healing application
    applyDamage(combatId, targetId, damage, damageType, sourceId = null) {
        const target = this.getEntity(targetId);
        if (!target) return;
        
        // Apply damage
        target.currentHealth = Math.max(0, target.currentHealth - damage);
        
        // Update combat participant if in combat
        if (combatId) {
            const combat = this.activeCombats.get(combatId);
            if (combat && combat.participants.has(targetId)) {
                const participant = combat.participants.get(targetId);
                participant.currentHealth = target.currentHealth;
                
                // Check for death
                if (participant.currentHealth <= 0) {
                    this.handleDeath(combatId, targetId, sourceId);
                }
            }
        } else {
            // Not in combat, check for death
            if (target.currentHealth <= 0) {
                this.handleEntityDeath(targetId, sourceId);
            }
        }
        
        // Update statistics
        this.combatStats.totalDamageDealt += damage;
        
        // Notify damage
        this.notifyDamage(targetId, damage, damageType, sourceId);
    }
    
    applyHealing(targetId, healing) {
        const target = this.getEntity(targetId);
        if (!target) return;
        
        const actualHealing = Math.min(healing, target.maxHealth - target.currentHealth);
        target.currentHealth += actualHealing;
        
        // Update combat participant if in combat
        for (const combat of this.activeCombats.values()) {
            if (combat.participants.has(targetId)) {
                const participant = combat.participants.get(targetId);
                participant.currentHealth = target.currentHealth;
                participant.healingDone += actualHealing;
                break;
            }
        }
        
        // Notify healing
        this.notifyHealing(targetId, actualHealing);
    }
    
    handleDeath(combatId, targetId, sourceId) {
        const combat = this.activeCombats.get(combatId);
        const target = combat.participants.get(targetId);
        
        if (!target) return;
        
        target.isDead = true;
        target.deathTime = Date.now();
        
        // Update statistics
        if (target.type === 'player') {
            this.combatStats.playerDeaths++;
        } else {
            this.combatStats.monsterDeaths++;
        }
        
        // Apply death penalty for players
        if (target.type === 'player') {
            this.applyDeathPenalty(targetId);
        }
        
        // Award experience to killer
        if (sourceId) {
            this.awardCombatExperience(sourceId, target);
        }
        
        // Log event
        this.logCombatEvent(combat, {
            type: 'death',
            victim: targetId,
            killer: sourceId,
            message: `${target.name} foi derrotado!`
        });
        
        // Notify participants
        this.notifyCombatEvent(combat, 'death', {
            victim: target.name,
            killer: sourceId ? combat.participants.get(sourceId)?.name : 'Unknown'
        });
        
        // Check if combat should end
        this.checkCombatEnd(combatId);
    }
    
    handleEntityDeath(entityId, sourceId) {
        const entity = this.getEntity(entityId);
        if (!entity) return;
        
        // Handle monster death
        if (entity.type === 'monster') {
            this.handleMonsterDeath(entityId, sourceId);
        }
        
        // Notify entity death
        this.notifyEntityDeath(entityId, sourceId);
    }
    
    applyDeathPenalty(playerId) {
        const player = this.getEntity(playerId);
        if (!player || player.type !== 'player') return;
        
        // XP penalty
        const xpPenalty = Math.floor(player.experience * this.config.deathPenalty);
        player.experience = Math.max(0, player.experience - xpPenalty);
        
        // Gold penalty (optional)
        // const goldPenalty = Math.floor(player.gold * 0.05);
        // player.gold = Math.max(0, player.gold - goldPenalty);
        
        // Notify player
        this.notifyDeathPenalty(playerId, xpPenalty);
    }
    
    awardCombatExperience(killerId, victim) {
        const killer = this.getEntity(killerId);
        if (!killer || killer.type !== 'player') return;
        
        // Calculate XP reward
        const xpReward = this.calculateXPReward(victim);
        
        // Award XP
        killer.gainExperience(xpReward);
        
        // Notify XP gain
        this.notifyExperienceGained(killerId, xpReward, victim.name);
    }
    
    calculateXPReward(victim) {
        const baseXP = victim.level * 20;
        const levelDiff = victim.level - 1; // Assuming killer is level 1 for now
        
        // Level difference modifier
        let multiplier = 1.0;
        if (levelDiff > 5) {
            multiplier = 1.5; // +50% XP for higher level victims
        } else if (levelDiff < -5) {
            multiplier = 0.1; // -90% XP for much lower level victims
        }
        
        return Math.floor(baseXP * multiplier);
    }
    
    // Combat flow management
    nextTurn(combatId) {
        const combat = this.activeCombats.get(combatId);
        if (!combat) return;
        
        // Find next alive participant
        let nextParticipantId = null;
        let attempts = 0;
        
        do {
            combat.currentTurn = (combat.currentTurn + 1) % combat.turnOrder.length;
            nextParticipantId = combat.turnOrder[combat.currentTurn];
            
            const participant = combat.participants.get(nextParticipantId);
            if (participant && !participant.isDead && !participant.hasFled) {
                break;
            }
            
            nextParticipantId = null;
            attempts++;
        } while (attempts < combat.turnOrder.length);
        
        if (nextParticipantId) {
            this.startTurn(combatId, nextParticipantId);
        } else {
            // No valid participants, end combat
            this.endCombat(combatId);
        }
    }
    
    checkCombatEnd(combatId) {
        const combat = this.activeCombats.get(combatId);
        if (!combat) return;
        
        const aliveParticipants = Array.from(combat.participants.values())
            .filter(p => !p.isDead && !p.hasFled);
        
        // Check if only one team remains
        const teams = new Set(aliveParticipants.map(p => p.role));
        
        if (teams.size <= 1) {
            // Combat ended
            this.endCombat(combatId);
        }
    }
    
    endCombat(combatId) {
        const combat = this.activeCombats.get(combatId);
        if (!combat) return;
        
        combat.state = 'finished';
        combat.endTime = Date.now();
        
        // Determine winner
        const aliveParticipants = Array.from(combat.participants.values())
            .filter(p => !p.isDead && !p.hasFled);
        
        const winner = aliveParticipants.length > 0 ? aliveParticipants[0] : null;
        
        // Process combat end rewards
        if (winner) {
            this.processCombatRewards(combatId, winner.id);
        }
        
        // Clean up participants
        for (const participant of combat.participants.values()) {
            const entity = this.getEntity(participant.id);
            if (entity) {
                entity.combatId = null;
            }
            
            // Clear status effects
            if (this.activeStatusEffects.has(participant.id)) {
                this.activeStatusEffects.delete(participant.id);
            }
        }
        
        // Log combat end
        this.logCombatEvent(combat, {
            type: 'combat_end',
            winner: winner?.id || null,
            duration: combat.endTime - combat.startTime,
            message: winner ? `${winner.name} venceu a batalha!` : 'A batalha terminou em empate!'
        });
        
        // Notify combat end
        this.notifyCombatEnd(combat, winner);
        
        // Remove from active combats (will be cleaned up by cleanup loop)
        setTimeout(() => {
            this.activeCombats.delete(combatId);
        }, 5000);
    }
    
    processCombatRewards(combatId, winnerId) {
        const combat = this.activeCombats.get(combatId);
        const winner = combat.participants.get(winnerId);
        
        if (!winner || winner.type !== 'player') return;
        
        // Calculate rewards
        const rewards = {
            xp: 50 * combat.participants.size,
            gold: 10 * combat.participants.size,
            items: []
        };
        
        // Award rewards
        const player = this.getEntity(winnerId);
        if (player) {
            player.gainExperience(rewards.xp);
            player.gold += rewards.gold;
            
            // Notify rewards
            this.notifyCombatRewards(winnerId, rewards);
        }
    }
    
    // Utility methods
    getEntity(entityId) {
        // Try to get from world manager
        const player = this.worldManager.connectedPlayers.get(entityId);
        if (player) return player;
        
        // Try to get from regions
        for (const region of this.worldManager.regions.values()) {
            const monster = region.monsters.get(entityId);
            if (monster) return monster;
            
            const npc = region.npcs.get(entityId);
            if (npc) return npc;
        }
        
        return null;
    }
    
    findOpponent(combat, participantId) {
        const participant = combat.participants.get(participantId);
        if (!participant) return null;
        
        // Find first opponent
        for (const [id, other] of combat.participants) {
            if (id !== participantId && other.role !== participant.role && 
                !other.isDead && !other.hasFled) {
                return id;
            }
        }
        
        return null;
    }
    
    getOpponents(participant) {
        const opponents = [];
        
        for (const combat of this.activeCombats.values()) {
            if (combat.participants.has(participant.id)) {
                for (const [id, other] of combat.participants) {
                    if (id !== participant.id && other.role !== participant.role) {
                        opponents.push(other);
                    }
                }
                break;
            }
        }
        
        return opponents;
    }
    
    isCombatAllowed(attacker, defender) {
        // Check if in safe zone
        if (this.isInSafeZone(attacker) || this.isInSafeZone(defender)) {
            return false;
        }
        
        // Check PvP rules
        if (attacker.type === 'player' && defender.type === 'player') {
            if (!this.config.pvpEnabled) return false;
            
            const levelDiff = Math.abs(attacker.level - defender.level);
            if (levelDiff > this.config.pvpLevelDiff) return false;
        }
        
        return true;
    }
    
    isInSafeZone(entity) {
        // Check if entity is in a safe zone
        // This would check entity's current region and position
        return false; // Simplified
    }
    
    getSkillData(skillId) {
        // This would load skill data from database or configuration
        const skills = {
            basic_attack: {
                name: 'Ataque Básico',
                type: 'attack',
                damage: 1.0,
                effects: []
            },
            power_strike: {
                name: 'Golpe Poderoso',
                type: 'attack',
                damage: 1.5,
                cost: { mana: 10 },
                effects: []
            },
            defensive_stance: {
                name: 'Postura Defensiva',
                type: 'buff',
                effects: [
                    { type: 'status_effect', effect: 'protection', duration: 10000 }
                ]
            }
        };
        
        return skills[skillId];
    }
    
    getSpellData(spellId) {
        // This would load spell data from database or configuration
        const spells = {
            fireball: {
                name: 'Bola de Fogo',
                type: 'spell',
                manaCost: 20,
                castTime: 2000,
                damage: 2.0,
                effects: [
                    { type: 'damage', damageType: 'fire', multiplier: 1.0 }
                ]
            },
            heal: {
                name: 'Cura',
                type: 'spell',
                manaCost: 15,
                castTime: 1500,
                effects: [
                    { type: 'heal', amount: 50 }
                ]
            },
            lightning_bolt: {
                name: 'Raio',
                type: 'spell',
                manaCost: 25,
                castTime: 1000,
                damage: 1.8,
                effects: [
                    { type: 'damage', damageType: 'lightning', multiplier: 1.0 },
                    { type: 'status_effect', effect: 'stun', duration: 1000 }
                ]
            }
        };
        
        return spells[spellId];
    }
    
    checkResourceCost(attacker, skill) {
        if (!skill.cost) return true;
        
        if (skill.cost.mana && attacker.currentMana < skill.cost.mana) {
            return false;
        }
        
        return true;
    }
    
    consumeResourceCost(attacker, skill) {
        if (!skill.cost) return;
        
        if (skill.cost.mana) {
            attacker.currentMana -= skill.cost.mana;
        }
    }
    
    applySkillEffect(combatId, attackerId, targetId, effect) {
        switch (effect.type) {
            case 'damage':
                const damage = this.damageFormulas[effect.damageType] || this.damageFormulas.physical;
                const finalDamage = damage(attackerId, targetId, effect.skill);
                this.applyDamage(combatId, targetId, finalDamage, effect.damageType, attackerId);
                break;
                
            case 'status_effect':
                this.applyStatusEffect(targetId, effect.effect, effect.duration);
                break;
        }
    }
    
    applySpellEffect(combatId, attackerId, targetId, effect) {
        // Similar to applySkillEffect but for spells
        this.applySkillEffect(combatId, attackerId, targetId, effect);
    }
    
    applyStatModifier(targetId, modifier, isBuff) {
        const target = this.getEntity(targetId);
        if (!target) return;
        
        for (const [stat, value] of Object.entries(modifier)) {
            if (isBuff) {
                target[stat] = (target[stat] || 0) + value;
            } else {
                target[stat] = Math.max(0, (target[stat] || 0) + value);
            }
        }
    }
    
    removeStatModifier(targetId, modifier) {
        const target = this.getEntity(targetId);
        if (!target) return;
        
        for (const [stat, value] of Object.entries(modifier)) {
            target[stat] = Math.max(0, (target[stat] || 0) - value);
        }
    }
    
    // Combat logging
    logCombatEvent(combat, event) {
        event.timestamp = Date.now();
        combat.events.push(event);
        combat.lastUpdate = Date.now();
        
        // Keep only last 100 events
        if (combat.events.length > 100) {
            combat.events = combat.events.slice(-100);
        }
    }
    
    // Notification methods
    notifyCombatStart(combat) {
        for (const [participantId, participant] of combat.participants) {
            if (participant.type === 'player') {
                this.worldManager.sendToPlayer(participantId, {
                    type: 'combat_start',
                    combatId: combat.id,
                    opponents: Array.from(combat.participants.values())
                        .filter(p => p.role !== participant.role)
                        .map(p => ({
                            id: p.id,
                            name: p.name,
                            level: p.level,
                            health: p.currentHealth,
                            maxHealth: p.maxHealth
                        }))
                });
            }
        }
    }
    
    notifyTurnStart(combat, participant) {
        if (participant.type === 'player') {
            this.worldManager.sendToPlayer(participant.id, {
                type: 'turn_start',
                combatId: combat.id
            });
        }
    }
    
    notifyCombatEvent(combat, eventType, data) {
        for (const [participantId, participant] of combat.participants) {
            if (participant.type === 'player') {
                this.worldManager.sendToPlayer(participantId, {
                    type: 'combat_event',
                    combatId: combat.id,
                    eventType: eventType,
                    data: data,
                    timestamp: Date.now()
                });
            }
        }
    }
    
    notifyDamage(targetId, damage, damageType, sourceId) {
        const target = this.getEntity(targetId);
        if (target && target.type === 'player') {
            this.worldManager.sendToPlayer(targetId, {
                type: 'damage_taken',
                damage: damage,
                damageType: damageType,
                sourceId: sourceId,
                currentHealth: target.currentHealth,
                maxHealth: target.maxHealth
            });
        }
    }
    
    notifyHealing(targetId, healing) {
        const target = this.getEntity(targetId);
        if (target && target.type === 'player') {
            this.worldManager.sendToPlayer(targetId, {
                type: 'healing_received',
                healing: healing,
                currentHealth: target.currentHealth,
                maxHealth: target.maxHealth
            });
        }
    }
    
    notifyStatusEffectApplied(targetId, effectId, stacks) {
        const target = this.getEntity(targetId);
        if (target && target.type === 'player') {
            const effect = this.statusEffects.get(effectId);
            this.worldManager.sendToPlayer(targetId, {
                type: 'status_effect_applied',
                effect: {
                    id: effectId,
                    name: effect.name,
                    icon: effect.icon,
                    color: effect.color,
                    stacks: stacks,
                    duration: effect.duration
                }
            });
        }
    }
    
    notifyStatusEffectRemoved(targetId, effectId) {
        const target = this.getEntity(targetId);
        if (target && target.type === 'player') {
            this.worldManager.sendToPlayer(targetId, {
                type: 'status_effect_removed',
                effectId: effectId
            });
        }
    }
    
    notifyDeathPenalty(playerId, xpPenalty) {
        this.worldManager.sendToPlayer(playerId, {
            type: 'death_penalty',
            xpPenalty: xpPenalty
        });
    }
    
    notifyExperienceGained(playerId, xp, sourceName) {
        this.worldManager.sendToPlayer(playerId, {
            type: 'experience_gained',
            xp: xp,
            source: sourceName
        });
    }
    
    notifyCombatRewards(playerId, rewards) {
        this.worldManager.sendToPlayer(playerId, {
            type: 'combat_rewards',
            rewards: rewards
        });
    }
    
    notifyCombatEnd(combat, winner) {
        for (const [participantId, participant] of combat.participants) {
            if (participant.type === 'player') {
                this.worldManager.sendToPlayer(participantId, {
                    type: 'combat_end',
                    combatId: combat.id,
                    winner: winner ? winner.name : null,
                    isWinner: winner && winner.id === participantId,
                    duration: combat.endTime - combat.startTime,
                    statistics: {
                        damageDealt: participant.damageDealt,
                        damageTaken: participant.damageTaken,
                        healingDone: participant.healingDone,
                        criticalHits: participant.criticalHits,
                        dodges: participant.dodges,
                        blocks: participant.blocks
                    }
                });
            }
        }
    }
    
    notifyEntityDeath(entityId, sourceId) {
        // Notify nearby players about entity death
        const entity = this.getEntity(entityId);
        if (!entity) return;
        
        const region = this.worldManager.regions.get(entity.regionId);
        if (!region) return;
        
        for (const playerId of region.players) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'entity_death',
                entityId: entityId,
                entityType: entity.type,
                sourceId: sourceId
            });
        }
    }
    
    // Update loops
    updateActiveCombats() {
        const now = Date.now();
        
        for (const [combatId, combat] of this.activeCombats) {
            if (combat.state !== 'active') continue;
            
            // Check for timeout
            if (now - combat.startTime > combat.maxDuration) {
                this.endCombat(combatId);
                continue;
            }
            
            // Update mana regeneration
            for (const participant of combat.participants.values()) {
                if (participant.type === 'player' && !participant.isDead) {
                    const manaRegen = 2; // 2 mana per second
                    participant.currentMana = Math.min(
                        participant.maxMana,
                        participant.currentMana + manaRegen
                    );
                }
            }
        }
    }
    
    cleanupFinishedCombats() {
        const now = Date.now();
        const toRemove = [];
        
        for (const [combatId, combat] of this.activeCombats) {
            if (combat.state === 'finished' && (now - combat.endTime) > 30000) {
                toRemove.push(combatId);
            }
        }
        
        for (const combatId of toRemove) {
            this.activeCombats.delete(combatId);
        }
    }
    
    // Gameplay Loop Methods
    initiateBasicAttack(playerId, targetId) {
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) return false;
        
        const target = this.getEntity(targetId);
        if (!target) return false;
        
        // Check if target is in range
        const distance = this.calculateDistance(player, target);
        if (distance > this.config.maxCombatRange) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'attack_failed',
                reason: 'out_of_range',
                message: 'Target is out of range.'
            });
            return false;
        }
        
        // Check if target is hostile
        if (!this.isHostile(player, target)) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'attack_failed',
                reason: 'not_hostile',
                message: 'Cannot attack friendly targets.'
            });
            return false;
        }
        
        // Get or create combat
        let combat = this.getCombatBetween(playerId, targetId);
        if (!combat) {
            combat = this.initiateCombat(playerId, targetId);
        }
        
        // Perform attack
        return this.performAction(combat.id, playerId, {
            type: 'attack',
            targetId: targetId,
            skill: 'basic_attack'
        });
    }
    
    performBasicAttack(combatId, attackerId, targetId) {
        const combat = this.activeCombats.get(combatId);
        if (!combat) return false;
        
        const attacker = combat.participants.get(attackerId);
        const target = combat.participants.get(targetId);
        
        if (!attacker || !target || target.isDead) return false;
        
        // Calculate hit chance
        const hitChance = this.calculateHitChance(attacker, target);
        const isHit = Math.random() < hitChance;
        
        if (!isHit) {
            // Miss
            this.broadcastCombatEvent(combatId, {
                type: 'attack_missed',
                attackerId: attackerId,
                targetId: targetId
            });
            
            return { success: false, reason: 'miss' };
        }
        
        // Calculate damage
        const damage = this.damageFormulas.physical(attacker, target, { damage: attacker.attack || 10 });
        
        // Apply damage
        const actualDamage = this.applyDamage(targetId, damage);
        
        // Check for critical hit
        const isCritical = Math.random() < this.config.critChance;
        const finalDamage = isCritical ? Math.floor(actualDamage * this.config.critMultiplier) : actualDamage;
        
        // Update target health
        target.currentHealth = Math.max(0, target.currentHealth - finalDamage);
        
        // Broadcast damage
        this.broadcastCombatEvent(combatId, {
            type: 'damage_dealt',
            attackerId: attackerId,
            targetId: targetId,
            damage: finalDamage,
            damageType: 'physical',
            isCritical: isCritical
        });
        
        // Check if target died
        if (target.currentHealth <= 0) {
            this.handleDeath(combatId, targetId, attackerId);
        }
        
        // Update statistics
        this.combatStats.totalDamage += finalDamage;
        
        return {
            success: true,
            damage: finalDamage,
            isCritical: isCritical,
            targetDead: target.currentHealth <= 0
        };
    }
    
    handleDeath(combatId, victimId, killerId) {
        const combat = this.activeCombats.get(combatId);
        if (!combat) return;
        
        const victim = combat.participants.get(victimId);
        const killer = combat.participants.get(killerId);
        
        if (!victim || !killer) return;
        
        victim.isDead = true;
        victim.deathTime = Date.now();
        
        // Calculate experience reward
        let experienceReward = 0;
        let loot = [];
        
        if (victim.type === 'monster') {
            experienceReward = this.calculateExperienceReward(victim, killer);
            loot = this.generateLoot(victim);
            
            // Award experience to killer
            if (killer.type === 'player') {
                this.awardExperience(killer.id, experienceReward);
            }
            
            // Handle mob respawn
            this.scheduleMobRespawn(victim);
        }
        
        // Broadcast death
        this.broadcastCombatEvent(combatId, {
            type: 'entity_death',
            victimId: victimId,
            killerId: killerId,
            experience: experienceReward,
            loot: loot
        });
        
        // Update statistics
        this.combatStats.totalKills++;
        if (victim.type === 'player') {
            this.combatStats.totalDeaths++;
        }
        
        // Remove dead participant from combat
        combat.participants.delete(victimId);
        
        // Check if combat should end
        this.checkCombatEnd(combatId);
    }
    
    calculateExperienceReward(victim, killer) {
        const baseXP = victim.level * 10;
        const levelDiff = victim.level - killer.level;
        
        // Level difference modifier
        let modifier = 1.0;
        if (levelDiff > 5) {
            modifier = 0.1; // Too high level, minimal XP
        } else if (levelDiff < -5) {
            modifier = 2.0; // Low level, bonus XP
        } else if (levelDiff < 0) {
            modifier = 1.5; // Slightly lower level, bonus XP
        }
        
        return Math.floor(baseXP * modifier);
    }
    
    generateLoot(victim) {
        const loot = [];
        
        // Gold drop
        if (Math.random() < 0.8) { // 80% chance to drop gold
            const goldAmount = Math.floor(victim.level * (5 + Math.random() * 10));
            loot.push({
                id: 'gold',
                name: 'Gold',
                quantity: goldAmount,
                rarity: 'common'
            });
        }
        
        // Item drops
        const dropChance = 0.3; // 30% base drop chance
        if (Math.random() < dropChance) {
            const possibleItems = this.getLootTable(victim.type);
            if (possibleItems.length > 0) {
                const item = possibleItems[Math.floor(Math.random() * possibleItems.length)];
                loot.push({
                    ...item,
                    quantity: 1
                });
            }
        }
        
        return loot;
    }
    
    getLootTable(monsterType) {
        const lootTables = {
            'wolf': [
                { id: 'wolf_pelt', name: 'Wolf Pelt', rarity: 'common' },
                { id: 'wolf_teeth', name: 'Wolf Teeth', rarity: 'uncommon' }
            ],
            'goblin': [
                { id: 'goblin_ear', name: 'Goblin Ear', rarity: 'common' },
                { id: 'rusty_dagger', name: 'Rusty Dagger', rarity: 'uncommon' }
            ],
            'dragon': [
                { id: 'dragon_scale', name: 'Dragon Scale', rarity: 'rare' },
                { id: 'dragon_bone', name: 'Dragon Bone', rarity: 'epic' }
            ]
        };
        
        return lootTables[monsterType] || [];
    }
    
    awardExperience(playerId, amount) {
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) return;
        
        player.addExperience(amount);
        
        // Notify player
        this.worldManager.sendToPlayer(playerId, {
            type: 'experience_gained',
            amount: amount,
            totalXP: player.experience,
            level: player.level
        });
    }
    
    scheduleMobRespawn(victim) {
        const respawnTime = 30000 + Math.random() * 30000; // 30-60 seconds
        
        setTimeout(() => {
            this.respawnMob(victim);
        }, respawnTime);
    }
    
    respawnMob(victim) {
        // Find the region where the mob died
        const regionId = this.worldManager.getEntityRegion(victim.id);
        const region = this.worldManager.regions.get(regionId);
        
        if (!region) return;
        
        // Respawn mob at original position or nearby
        const spawnX = victim.homeX || victim.x || 0;
        const spawnY = victim.homeY || victim.y || 0;
        
        // Reset mob stats
        victim.currentHealth = victim.maxHealth;
        victim.currentMana = victim.maxMana || 0;
        victim.isDead = false;
        victim.x = spawnX;
        victim.y = spawnY;
        victim.target = null;
        
        // Add mob back to region
        region.monsters.set(victim.id, victim);
        
        // Notify nearby players
        this.worldManager.sendToRegion(regionId, {
            type: 'mob_respawned',
            mobId: victim.id,
            position: { x: spawnX, y: spawnY }
        });
    }
    
    getEntity(entityId) {
        // Try player first
        const player = this.worldManager.connectedPlayers.get(entityId);
        if (player) return player;
        
        // Try mob
        for (const region of this.worldManager.regions.values()) {
            const mob = region.monsters.get(entityId);
            if (mob) return mob;
        }
        
        return null;
    }
    
    getCombatBetween(entityId1, entityId2) {
        for (const combat of this.activeCombats.values()) {
            if (combat.participants.has(entityId1) && combat.participants.has(entityId2)) {
                return combat;
            }
        }
        return null;
    }
    
    isHostile(attacker, target) {
        // Simple hostility check - can be expanded
        if (attacker.type === 'player' && target.type === 'monster') return true;
        if (attacker.type === 'monster' && target.type === 'player') return true;
        if (attacker.type === 'monster' && target.type === 'monster') return false; // Monsters don't attack each other
        if (attacker.type === 'player' && target.type === 'player') {
            // PvP check - simplified for now
            return this.config.pvpEnabled;
        }
        
        return false;
    }
    
    calculateDistance(entity1, entity2) {
        const dx = entity1.x - entity2.x;
        const dy = entity1.y - entity2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    broadcastCombatEvent(combatId, event) {
        const combat = this.activeCombats.get(combatId);
        if (!combat) return;
        
        // Send to all participants
        for (const participant of combat.participants.values()) {
            if (participant.type === 'player') {
                this.worldManager.sendToPlayer(participant.id, {
                    type: 'combat_event',
                    combatId: combatId,
                    event: event,
                    timestamp: Date.now()
                });
            }
        }
        
        // Also send to nearby players for visual effects
        this.sendToNearbyPlayers(combat, event);
    }
    
    sendToNearbyPlayers(combat, event) {
        // Get a participant position to determine nearby area
        let referencePos = null;
        for (const participant of combat.participants.values()) {
            referencePos = { x: participant.x, y: participant.y };
            break;
        }
        
        if (!referencePos) return;
        
        // Find nearby players
        for (const [playerId, player] of this.worldManager.connectedPlayers) {
            if (combat.participants.has(playerId)) continue; // Already sent to participants
            
            const distance = this.calculateDistance(referencePos, player);
            if (distance <= 200) { // 200 unit visibility range
                this.worldManager.sendToPlayer(playerId, {
                    type: 'nearby_combat_event',
                    event: event,
                    timestamp: Date.now()
                });
            }
        }
    }
    
    // Public API
    getCombatStatus(combatId) {
        const combat = this.activeCombats.get(combatId);
        if (!combat) return null;
        
        return {
            id: combat.id,
            state: combat.state,
            duration: Date.now() - combat.startTime,
            participants: Array.from(combat.participants.values()).map(p => ({
                id: p.id,
                name: p.name,
                health: p.currentHealth,
                maxHealth: p.maxHealth,
                mana: p.currentMana,
                maxMana: p.maxMana,
                isDead: p.isDead,
                hasFled: p.hasFled
            })),
            currentTurn: combat.turnOrder[combat.currentTurn]
        };
    }
    
    getCombatStatistics() {
        return this.combatStats;
    }
    
    // Database operations
    async saveCombatConfig() {
        try {
            await this.database.set('combat_config', this.config);
        } catch (error) {
            console.error('Error saving combat config:', error);
        }
    }
    
    // Cleanup
    cleanup() {
        this.activeCombats.clear();
        this.combatQueue = [];
        this.statusEffects.clear();
        this.activeStatusEffects.clear();
    }
}

module.exports = CombatSystem;
