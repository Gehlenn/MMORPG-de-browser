/**
 * Monster Entity Class
 * Represents monsters with AI, variants, and advanced behaviors
 */

import Entity from './Entity.js';

class Monster extends Entity {
    constructor(config = {}) {
        super({
            type: 'monster',
            solid: true,
            blocking: true,
            interactive: false,
            ...config
        });
        
        // Monster-specific properties
        this.monsterType = config.monsterType || 'goblin';
        this.species = config.species || this.monsterType;
        this.family = config.family || this.getMonsterFamily();
        
        // AI properties
        this.aiState = config.aiState || 'idle';
        this.aiConfig = config.aiConfig || this.getDefaultAIConfig();
        this.aiParams = config.aiParams || {};
        
        // Combat behavior
        this.aggressionRange = config.aggressionRange || 5;
        this.attackRange = config.attackRange || 1;
        this.sightRange = config.sightRange || 8;
        this.leashRange = config.leashRange || 15;
        this.patrolPath = config.patrolPath || [];
        this.patrolIndex = 0;
        this.patrolDirection = 1;
        
        // Spawn properties
        this.spawnPoint = { x: this.x, y: this.y };
        this.respawnTime = config.respawnTime || 30000; // 30 seconds
        this.respawnTimer = 0;
        this.isRespawning = false;
        
        // Variant system
        this.variant = config.variant || 'normal'; // normal, elite, rare, boss
        this.modifiers = config.modifiers || [];
        
        // Loot table
        this.lootTable = config.lootTable || this.getDefaultLootTable();
        this.dropRates = config.dropRates || this.getDefaultDropRates();
        
        // Experience and rewards
        this.experienceValue = config.experienceValue || this.calculateExperienceValue();
        this.goldValue = config.goldValue || this.calculateGoldValue();
        
        // Special abilities
        this.abilities = config.abilities || this.getDefaultAbilities();
        this.abilityCooldowns = new Map();
        
        // State tracking
        this.target = null;
        this.lastKnownTargetPosition = null;
        this.homePosition = { x: this.x, y: this.y };
        this.lastAttackTime = 0;
        this.lastMoveTime = 0;
        this.stuckCounter = 0;
        
        // Visual variants
        this.size = config.size || 1.0;
        this.color = config.color || this.getMonsterColor();
        this.spriteVariation = config.spriteVariation || 0;
        
        // Apply variant modifiers
        this.applyVariantModifiers();
        
        // Initialize AI
        this.initializeAI();
    }
    
    getMonsterFamily() {
        const familyMap = {
            goblin: 'humanoid',
            orc: 'humanoid',
            troll: 'giant',
            dragon: 'dragon',
            wolf: 'beast',
            bear: 'beast',
            spider: 'insect',
            slime: 'slime',
            skeleton: 'undead',
            zombie: 'undead',
            ghost: 'undead',
            demon: 'demon',
            elemental: 'elemental',
            golem: 'construct'
        };
        return familyMap[this.monsterType] || 'unknown';
    }
    
    getDefaultAIConfig() {
        return {
            idle: {
                chanceToMove: 0.3,
                moveRadius: 2,
                waitTime: 2000
            },
            patrol: {
                speed: 0.8,
                pauseAtWaypoints: true,
                pauseDuration: 1000
            },
            aggro: {
                chaseSpeed: 1.2,
                attackCooldown: 2000,
                retreatThreshold: 0.2
            },
            return: {
                speed: 1.5,
                healOnReturn: false
            }
        };
    }
    
    getDefaultLootTable() {
        return [
            { itemId: 'gold', chance: 0.8, minAmount: 1, maxAmount: 10 },
            { itemId: 'health_potion', chance: 0.3, minAmount: 1, maxAmount: 1 },
            { itemId: 'monster_part', chance: 0.6, minAmount: 1, maxAmount: 3 }
        ];
    }
    
    getDefaultDropRates() {
        const baseRates = {
            normal: 1.0,
            elite: 1.5,
            rare: 3.0,
            boss: 10.0
        };
        return baseRates[this.variant] || 1.0;
    }
    
    getDefaultAbilities() {
        const abilities = {
            goblin: ['slash'],
            orc: ['heavy_attack'],
            wolf: ['bite', 'howl'],
            spider: ['poison_bite', 'web'],
            skeleton: ['bone_throw'],
            dragon: ['fire_breath', 'tail_swipe', 'wing_attack']
        };
        return abilities[this.monsterType] || ['basic_attack'];
    }
    
    getMonsterColor() {
        const colors = {
            normal: '#ef4444',
            elite: '#f97316',
            rare: '#a855f7',
            boss: '#dc2626'
        };
        return colors[this.variant] || '#ef4444';
    }
    
    applyVariantModifiers() {
        switch (this.variant) {
            case 'elite':
                this.maxHealth *= 2;
                this.health = this.maxHealth;
                this.attack *= 1.5;
                this.defense *= 1.3;
                this.experienceValue *= 2;
                this.goldValue *= 2;
                this.size = 1.2;
                break;
                
            case 'rare':
                this.maxHealth *= 3;
                this.health = this.maxHealth;
                this.attack *= 1.8;
                this.defense *= 1.5;
                this.experienceValue *= 4;
                this.goldValue *= 3;
                this.size = 1.3;
                this.addRandomModifier();
                break;
                
            case 'boss':
                this.maxHealth *= 10;
                this.health = this.maxHealth;
                this.attack *= 3;
                this.defense *= 2;
                this.experienceValue *= 20;
                this.goldValue *= 10;
                this.size = 2.0;
                this.addBossModifiers();
                break;
        }
    }
    
    addRandomModifier() {
        const modifiers = ['enraged', 'armored', 'swift', 'regenerating', 'poisonous'];
        const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
        this.modifiers.push(modifier);
        
        switch (modifier) {
            case 'enraged':
                this.attack *= 1.5;
                this.defense *= 0.8;
                break;
            case 'armored':
                this.defense *= 2;
                this.speed *= 0.7;
                break;
            case 'swift':
                this.speed *= 1.5;
                this.attackSpeed *= 1.3;
                break;
            case 'regenerating':
                this.addStatusEffect({
                    type: 'regeneration',
                    heal: this.maxHealth * 0.02,
                    duration: Infinity
                });
                break;
            case 'poisonous':
                this.abilities.push('poison_attack');
                break;
        }
    }
    
    addBossModifiers() {
        this.modifiers.push('boss', 'immunity', 'enraged');
        this.abilities.push('area_attack', 'summon_minions');
        this.immunities.push('stun', 'knockback');
    }
    
    calculateExperienceValue() {
        const baseExp = {
            goblin: 20,
            orc: 45,
            wolf: 30,
            spider: 35,
            skeleton: 40,
            troll: 80,
            dragon: 500
        };
        return baseExp[this.monsterType] || 25;
    }
    
    calculateGoldValue() {
        const baseGold = {
            goblin: 12,
            orc: 24,
            wolf: 18,
            spider: 22,
            skeleton: 20,
            troll: 50,
            dragon: 200
        };
        return baseGold[this.monsterType] || 15;
    }
    
    initializeAI() {
        // Set initial patrol path if not provided
        if (this.patrolPath.length === 0) {
            this.generatePatrolPath();
        }
    }
    
    generatePatrolPath() {
        const pathLength = Math.floor(Math.random() * 3) + 2; // 2-4 waypoints
        this.patrolPath = [];
        
        for (let i = 0; i < pathLength; i++) {
            const angle = (i / pathLength) * Math.PI * 2;
            const radius = Math.random() * 3 + 2;
            const x = Math.floor(this.homePosition.x + Math.cos(angle) * radius);
            const y = Math.floor(this.homePosition.y + Math.sin(angle) * radius);
            
            this.patrolPath.push({ x, y });
        }
    }
    
    onUpdate(deltaTime) {
        super.onUpdate(deltaTime);
        
        if (!this.alive) {
            this.handleRespawn(deltaTime);
            return;
        }
        
        // Update AI based on current state
        switch (this.aiState) {
            case 'idle':
                this.updateIdleAI(deltaTime);
                break;
            case 'patrol':
                this.updatePatrolAI(deltaTime);
                break;
            case 'aggro':
                this.updateAggroAI(deltaTime);
                break;
            case 'return':
                this.updateReturnAI(deltaTime);
                break;
            case 'dead':
                // Handled by handleRespawn
                break;
        }
        
        // Update ability cooldowns
        this.updateAbilityCooldowns(deltaTime);
    }
    
    updateIdleAI(deltaTime) {
        const config = this.aiConfig.idle;
        
        // Random movement
        if (Math.random() < config.chanceToMove * deltaTime / 1000) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * config.moveRadius;
            const targetX = Math.floor(this.homePosition.x + Math.cos(angle) * distance);
            const targetY = Math.floor(this.homePosition.y + Math.sin(angle) * distance);
            
            this.tryMoveTo(targetX, targetY);
        }
        
        // Check for targets
        this.checkForTargets();
    }
    
    updatePatrolAI(deltaTime) {
        if (this.patrolPath.length === 0) {
            this.aiState = 'idle';
            return;
        }
        
        const target = this.patrolPath[this.patrolIndex];
        const distance = this.getDistanceTo(target);
        
        if (distance < 1) {
            // Reached waypoint
            if (this.aiConfig.patrol.pauseAtWaypoints) {
                this.aiState = 'idle';
                setTimeout(() => {
                    if (this.aiState === 'idle') {
                        this.patrolIndex += this.patrolDirection;
                        
                        if (this.patrolIndex >= this.patrolPath.length || this.patrolIndex < 0) {
                            this.patrolDirection *= -1;
                            this.patrolIndex += this.patrolDirection * 2;
                        }
                        
                        this.aiState = 'patrol';
                    }
                }, this.aiConfig.patrol.pauseDuration);
            } else {
                this.patrolIndex = (this.patrolIndex + 1) % this.patrolPath.length;
            }
        } else {
            // Move to waypoint
            this.tryMoveTo(target.x, target.y);
        }
        
        // Check for targets
        this.checkForTargets();
    }
    
    updateAggroAI(deltaTime) {
        if (!this.target || !this.target.alive) {
            this.aiState = 'return';
            this.target = null;
            return;
        }
        
        const distance = this.getDistanceTo(this.target);
        
        // Check if target is too far (leash)
        if (distance > this.leashRange) {
            this.aiState = 'return';
            this.target = null;
            return;
        }
        
        // Check if should retreat
        const healthPercent = this.health / this.maxHealth;
        if (healthPercent < this.aiConfig.aggro.retreatThreshold && this.variant !== 'boss') {
            this.aiState = 'return';
            return;
        }
        
        // Combat behavior
        if (distance <= this.attackRange) {
            this.tryAttack();
        } else if (distance <= this.sightRange) {
            this.chaseTarget();
        } else {
            this.aiState = 'return';
        }
        
        // Use abilities
        this.tryUseAbilities();
    }
    
    updateReturnAI(deltaTime) {
        const distance = this.getDistanceTo(this.homePosition);
        
        if (distance < 1) {
            this.aiState = 'idle';
            
            // Heal if configured
            if (this.aiConfig.return.healOnReturn) {
                this.health = this.maxHealth;
            }
        } else {
            this.tryMoveTo(this.homePosition.x, this.homePosition.y);
        }
        
        // Still check for targets while returning
        this.checkForTargets();
    }
    
    checkForTargets() {
        if (this.target && this.target.alive) return;
        
        // Find nearby targets (usually players)
        if (this.entityManager) {
            const nearbyEntities = this.entityManager.getEntitiesInRange(
                this.x, this.y, this.sightRange
            );
            
            for (const entity of nearbyEntities) {
                if (entity.type === 'player' && entity.alive) {
                    // Check line of sight
                    if (this.hasLineOfSightTo(entity)) {
                        this.aggroTarget(entity);
                        break;
                    }
                }
            }
        }
    }
    
    hasLineOfSightTo(target) {
        // Simple line of sight check
        if (this.world && this.world.mapData) {
            return this.world.mapData.hasLineOfSight(
                this.x, this.y, target.x, target.y, this.sightRange
            );
        }
        return true; // No map data, assume LOS
    }
    
    aggroTarget(target) {
        this.target = target;
        this.lastKnownTargetPosition = { x: target.x, y: target.y };
        this.aiState = 'aggro';
        
        this.emit('aggro', { target });
    }
    
    chaseTarget() {
        if (!this.target) return;
        
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const moveX = this.x + Math.sign(dx);
            const moveY = this.y + Math.sign(dy);
            
            // Try to move closer
            if (Math.abs(dx) > Math.abs(dy)) {
                this.tryMoveTo(moveX, this.y);
            } else {
                this.tryMoveTo(this.x, moveY);
            }
        }
    }
    
    tryMoveTo(x, y) {
        const now = Date.now();
        const moveDelay = 1000 / (this.speed * this.movementSpeed);
        
        if (now - this.lastMoveTime < moveDelay) {
            return false;
        }
        
        if (this.moveTo(x, y)) {
            this.lastMoveTime = now;
            this.stuckCounter = 0;
            return true;
        } else {
            this.stuckCounter++;
            
            // If stuck, try random movement
            if (this.stuckCounter > 3) {
                const randomX = this.x + Math.floor(Math.random() * 3) - 1;
                const randomY = this.y + Math.floor(Math.random() * 3) - 1;
                this.moveTo(randomX, randomY);
                this.stuckCounter = 0;
            }
            
            return false;
        }
    }
    
    tryAttack() {
        const now = Date.now();
        const attackDelay = this.aiConfig.aggro.attackCooldown / this.attackSpeed;
        
        if (now - this.lastAttackTime < attackDelay) {
            return;
        }
        
        if (this.target && this.getDistanceTo(this.target) <= this.attackRange) {
            this.performAttack(this.target);
            this.lastAttackTime = now;
        }
    }
    
    performAttack(target) {
        let damage = this.attack;
        
        // Check for critical hit
        const isCrit = Math.random() < 0.05; // 5% base crit chance
        if (isCrit) {
            damage *= 1.5;
        }
        
        const actualDamage = target.takeDamage(damage, this.id, 'physical');
        
        this.emit('attack', { target, damage: actualDamage, critical: isCrit });
        
        return actualDamage;
    }
    
    tryUseAbilities() {
        for (const ability of this.abilities) {
            if (this.canUseAbility(ability)) {
                this.useAbility(ability);
                break; // Use one ability at a time
            }
        }
    }
    
    canUseAbility(ability) {
        // Check cooldown
        if (this.abilityCooldowns.has(ability)) {
            return false;
        }
        
        // Check range and other conditions
        switch (ability) {
            case 'poison_bite':
                return this.target && this.getDistanceTo(this.target) <= this.attackRange;
            case 'howl':
                return true; // No range requirement
            case 'fire_breath':
                return this.target && this.getDistanceTo(this.target) <= 3;
            default:
                return this.target && this.getDistanceTo(this.target) <= this.attackRange;
        }
    }
    
    useAbility(ability) {
        // Set cooldown
        const cooldown = this.getAbilityCooldown(ability);
        this.abilityCooldowns.set(ability, Date.now() + cooldown);
        
        // Execute ability effect
        switch (ability) {
            case 'poison_bite':
                if (this.target) {
                    const damage = this.performAttack(this.target);
                    this.target.addStatusEffect({
                        type: 'poison',
                        damage: damage * 0.1,
                        duration: 5000
                    });
                }
                break;
                
            case 'howl':
                // Fear nearby players
                if (this.entityManager) {
                    const nearby = this.entityManager.getEntitiesInRange(this.x, this.y, 5);
                    for (const entity of nearby) {
                        if (entity.type === 'player') {
                            entity.addStatusEffect({
                                type: 'fear',
                                duration: 2000
                            });
                        }
                    }
                }
                break;
                
            case 'fire_breath':
                // Area damage in cone
                if (this.entityManager) {
                    const targets = this.getTargetsInCone(3, 45);
                    for (const target of targets) {
                        target.takeDamage(this.attack * 1.5, this.id, 'fire');
                    }
                }
                break;
                
            default:
                this.performAttack(this.target);
        }
        
        this.emit('ability_used', { ability });
    }
    
    getAbilityCooldown(ability) {
        const cooldowns = {
            basic_attack: 2000,
            heavy_attack: 3000,
            poison_bite: 4000,
            howl: 8000,
            fire_breath: 6000,
            area_attack: 5000,
            summon_minions: 15000
        };
        return cooldowns[ability] || 2000;
    }
    
    getTargetsInCone(range, angle) {
        // Get targets in a cone in front of the monster
        const targets = [];
        
        if (this.entityManager && this.target) {
            const angleToTarget = Math.atan2(
                this.target.y - this.y,
                this.target.x - this.x
            );
            
            const nearby = this.entityManager.getEntitiesInRange(this.x, this.y, range);
            for (const entity of nearby) {
                if (entity === this || entity.type !== 'player') continue;
                
                const angleToEntity = Math.atan2(
                    entity.y - this.y,
                    entity.x - this.x
                );
                
                const angleDiff = Math.abs(angleToEntity - angleToTarget);
                if (angleDiff <= (angle * Math.PI / 180)) {
                    targets.push(entity);
                }
            }
        }
        
        return targets;
    }
    
    updateAbilityCooldowns(deltaTime) {
        // Cooldowns are handled by timestamps, so no update needed
    }
    
    handleRespawn(deltaTime) {
        if (!this.isRespawning) {
            this.isRespawning = true;
            this.respawnTimer = this.respawnTime;
        }
        
        this.respawnTimer -= deltaTime;
        
        if (this.respawnTimer <= 0) {
            this.respawn();
        }
    }
    
    respawn() {
        // Reset to spawn state
        this.x = this.spawnPoint.x;
        this.y = this.spawnPoint.y;
        this.health = this.maxHealth;
        this.alive = true;
        this.active = true;
        this.aiState = 'idle';
        this.target = null;
        this.isRespawning = false;
        this.stuckCounter = 0;
        
        // Clear cooldowns
        this.abilityCooldowns.clear();
        this.statusEffects = [];
        
        this.emit('respawn');
    }
    
    die(source = 'unknown') {
        super.die(source);
        
        this.aiState = 'dead';
        this.target = null;
        
        // Generate loot
        this.generateLoot();
        
        // Award experience to killer
        if (this.entityManager && source) {
            const killer = this.entityManager.getEntity(source);
            if (killer && killer.addExperience) {
                killer.addExperience(this.experienceValue);
            }
        }
        
        this.emit('death', { source, experience: this.experienceValue, gold: this.goldValue });
    }
    
    generateLoot() {
        const loot = [];
        
        for (const item of this.lootTable) {
            const chance = item.chance * this.dropRates;
            if (Math.random() < chance) {
                const amount = Math.floor(Math.random() * (item.maxAmount - item.minAmount + 1)) + item.minAmount;
                loot.push({
                    itemId: item.itemId,
                    amount: amount,
                    x: this.x,
                    y: this.y
                });
            }
        }
        
        // Spawn loot items in the world
        if (this.entityManager) {
            for (const itemData of loot) {
                this.entityManager.createEntity('item', {
                    itemId: itemData.itemId,
                    amount: itemData.amount,
                    x: itemData.x,
                    y: itemData.y
                });
            }
        }
        
        return loot;
    }
    
    renderEffects(ctx, x, y) {
        super.renderEffects(ctx, x, y);
        
        // Render variant-specific effects
        if (this.variant === 'rare') {
            // Purple glow for rare monsters
            ctx.shadowColor = '#a855f7';
            ctx.shadowBlur = 10;
            ctx.fillStyle = 'rgba(168, 85, 247, 0.3)';
            ctx.fillRect(x - 2, y - 2, 36, 36);
            ctx.shadowBlur = 0;
        } else if (this.variant === 'boss') {
            // Red aura for bosses
            ctx.shadowColor = '#dc2626';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = 'rgba(220, 38, 38, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 4, y - 4, 40, 40);
            ctx.shadowBlur = 0;
        }
        
        // Render status indicators
        if (this.aiState === 'aggro') {
            // Exclamation mark when aggroed
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('!', x + 16, y - 5);
        }
    }
    
    // Serialization
    serialize() {
        const baseData = super.serialize();
        
        return {
            ...baseData,
            monsterType: this.monsterType,
            species: this.species,
            family: this.family,
            aiState: this.aiState,
            aiConfig: this.aiConfig,
            aggressionRange: this.aggressionRange,
            attackRange: this.attackRange,
            sightRange: this.sightRange,
            leashRange: this.leashRange,
            patrolPath: this.patrolPath,
            spawnPoint: this.spawnPoint,
            respawnTime: this.respawnTime,
            variant: this.variant,
            modifiers: this.modifiers,
            lootTable: this.lootTable,
            experienceValue: this.experienceValue,
            goldValue: this.goldValue,
            abilities: this.abilities,
            size: this.size
        };
    }
    
    deserialize(data) {
        super.deserialize(data);
        
        this.monsterType = data.monsterType;
        this.species = data.species;
        this.family = data.family;
        this.aiState = data.aiState;
        this.aiConfig = data.aiConfig;
        this.aggressionRange = data.aggressionRange;
        this.attackRange = data.attackRange;
        this.sightRange = data.sightRange;
        this.leashRange = data.leashRange;
        this.patrolPath = data.patrolPath;
        this.spawnPoint = data.spawnPoint;
        this.respawnTime = data.respawnTime;
        this.variant = data.variant;
        this.modifiers = data.modifiers;
        this.lootTable = data.lootTable;
        this.experienceValue = data.experienceValue;
        this.goldValue = data.goldValue;
        this.abilities = data.abilities;
        this.size = data.size;
        
        this.homePosition = { x: this.x, y: this.y };
    }
}

export default Monster;
