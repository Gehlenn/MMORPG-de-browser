/**
 * AncientConstruct.js
 * 
 * Ancient Construct mob for Aurélia desert zone
 * Level 48, neutral guardian with regeneration and defensive abilities
 * Special: Regenerates HP, protects treasures
 */

class AncientConstruct {
    constructor(id, position, zone, protectedTreasure = null) {
        this.id = id || `construct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.type = 'ancient_construct';
        this.name = 'Ancient Construct';
        this.level = 48;
        
        // Position
        this.x = position?.x || 0;
        this.y = position?.y || 0;
        this.zone = zone || 'aurelia';
        this.subZone = position?.subZone || 'ruins_ankhet';
        
        // Treasure protection
        this.protectedTreasure = protectedTreasure; // Object being guarded
        this.guardRadius = 150;
        this.isAggressive = false; // Neutral until provoked
        
        // Stats
        this.maxHp = 1000;
        this.hp = this.maxHp;
        this.damage = 70;
        this.attackSpeed = 0.7;
        this.moveSpeed = 60; // Slow but steady
        this.aggroRange = 180;
        this.attackRange = 45;
        this.leashRadius = 300;
        
        // Behavior
        this.behavior = 'guardian';
        this.state = 'guarding'; // guarding, active, defensive, enraged, returning
        this.target = null;
        this.guardPoint = { x: this.x, y: this.y };
        this.threats = new Map(); // playerId -> threatLevel
        
        // Special abilities
        this.abilities = {
            energyBeam: {
                name: 'Energy Beam',
                cooldown: 8000,
                lastUsed: 0,
                damage: this.damage * 1.2,
                range: 200,
                chargeTime: 1500,
                description: 'Charges and fires an energy beam'
            },
            shieldMode: {
                name: 'Shield Mode',
                cooldown: 20000,
                lastUsed: 0,
                duration: 8000,
                damageReduction: 0.75, // 75% damage reduction
                regenerationBoost: 2, // 2x regen
                description: 'Activates defensive shielding'
            },
            selfRepair: {
                name: 'Self Repair',
                cooldown: 15000,
                lastUsed: 0,
                healPercent: 0.15, // 15% max HP
                channelTime: 3000,
                description: 'Repairs itself over time'
            },
            guardianWrath: {
                name: 'Guardian Wrath',
                cooldown: 30000,
                lastUsed: 0,
                damage: this.damage * 2,
                knockback: 100,
                aoe: true,
                radius: 100,
                requiresEnrage: true,
                description: 'Powerful AoE when enraged'
            }
        };
        
        // Combat state
        this.inCombat = false;
        this.combatStartTime = null;
        this.lastAttackTime = 0;
        this.defensiveMode = false;
        this.enraged = false;
        this.enrageThreshold = 0.3; // Enrage at 30% HP
        
        // Regeneration
        this.regenRate = 0.01; // 1% per tick
        this.regenInterval = 5000; // Every 5 seconds
        this.lastRegen = Date.now();
        this.baseRegenRate = 0.01;
        
        // Loot
        this.xpValue = 200;
        this.drops = [
            { id: 'construct_core', name: 'Construct Core', chance: 0.4, min: 1, max: 1 },
            { id: 'relic_shard', name: 'Relic Shard', chance: 0.35, min: 1, max: 2 },
            { id: 'golden_gear', name: 'Golden Gear', chance: 0.25, min: 1, max: 3 },
            { id: 'ancient_relics', name: 'Ancient Relics', chance: 0.2, min: 1, max: 1 },
            { id: 'key_of_the_sun', name: 'Key of the Sun', chance: 0.05, min: 1, max: 1 } // Rare boss key
        ];
        
        // Resistances
        this.resistances = {
            physical: 0.5, // High physical resistance
            fire: 0.3,
            poison: 1.0, // Immune
            cold: 0.2,
            electric: -0.3, // Weak to electric
            magic: 0.1
        };
        
        // Shield mode state
        this.shieldActive = false;
        this.shieldEndTime = 0;
        
        // Self-repair state
        selfRepairing: false,
        this.repairEndTime = 0;
        
        // Spawn and despawn
        this.spawnTime = Date.now();
        this.respawnTime = 120000; // 2 minutes (tough mob)
        
        // Timers
        this.updateInterval = null;
        this.lastUpdate = Date.now();
        
        this.initialize();
    }
    
    initialize() {
        console.log(`[AncientConstruct] ${this.id} initialized guarding (${this.x}, ${this.y})`);
        this.startUpdateLoop();
    }
    
    startUpdateLoop() {
        this.updateInterval = setInterval(() => this.update(), 200);
    }
    
    update() {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;
        
        // Regeneration (always active unless dead)
        if (this.hp > 0 && this.hp < this.maxHp) {
            this.updateRegeneration();
        }
        
        // Check shield mode expiration
        if (this.shieldActive && now >= this.shieldEndTime) {
            this.deactivateShield();
        }
        
        // Check self-repair completion
        if (this.selfRepairing && now >= this.repairEndTime) {
            this.completeSelfRepair();
        }
        
        // Check enrage
        if (!this.enraged && this.hp / this.maxHp <= this.enrageThreshold) {
            this.enterEnrage();
        }
        
        // State machine
        switch (this.state) {
            case 'guarding':
                this.updateGuarding(deltaTime);
                break;
            case 'active':
                this.updateActive(deltaTime);
                break;
            case 'defensive':
                this.updateDefensive(deltaTime);
                break;
            case 'enraged':
                this.updateEnraged(deltaTime);
                break;
            case 'selfRepairing':
                this.updateSelfRepairing(deltaTime);
                break;
            case 'returning':
                this.updateReturning(deltaTime);
                break;
            case 'dead':
                break;
        }
    }
    
    updateRegeneration() {
        const now = Date.now();
        
        if (now - this.lastRegen >= this.regenInterval) {
            let regenAmount = this.maxHp * this.regenRate;
            
            // Shield mode boosts regen
            if (this.shieldActive) {
                regenAmount *= this.abilities.shieldMode.regenerationBoost;
            }
            
            // Don't overheal
            regenAmount = Math.min(regenAmount, this.maxHp - this.hp);
            this.hp += regenAmount;
            
            if (regenAmount > 0) {
                console.log(`[AncientConstruct] ${this.id} regenerated ${Math.floor(regenAmount)} HP`);
            }
            
            this.lastRegen = now;
        }
    }
    
    updateGuarding(deltaTime) {
        // Check if treasure is being stolen
        if (this.protectedTreasure && this.protectedTreasure.beingLooted) {
            const looter = this.protectedTreasure.looter;
            this.threats.set(looter.id || looter, 100);
            this.setTarget(looter);
            this.isAggressive = true;
            return;
        }
        
        // Check for threats in guard radius
        if (this.target && this.getDistanceTo(this.target) <= this.guardRadius) {
            const threatLevel = this.threats.get(this.target.id || this.target) || 0;
            
            if (threatLevel > 50 || this.isAggressive) {
                this.state = 'active';
            }
        }
    }
    
    updateActive(deltaTime) {
        if (!this.target) {
            this.state = 'returning';
            return;
        }
        
        const distance = this.getDistanceTo(this.target);
        const distanceFromGuard = this.getDistanceTo(this.guardPoint);
        
        // Leash check
        if (distanceFromGuard > this.leashRadius) {
            this.loseTarget();
            this.state = 'returning';
            return;
        }
        
        // Check if should enter defensive mode
        if (this.hp / this.maxHp < 0.5 && !this.defensiveMode) {
            this.state = 'defensive';
            return;
        }
        
        // Combat
        this.updateCombat(deltaTime);
    }
    
    updateDefensive(deltaTime) {
        if (!this.defensiveMode) {
            this.activateShield();
        }
        
        if (!this.target) {
            this.deactivateShield();
            this.state = 'returning';
            return;
        }
        
        // Try self-repair if very low
        if (this.hp / this.maxHp < 0.3) {
            const now = Date.now();
            const repair = this.abilities.selfRepair;
            if (now - repair.lastUsed >= repair.cooldown && !this.selfRepairing) {
                this.startSelfRepair();
                return;
            }
        }
        
        // Continue fighting with shield up
        this.updateCombat(deltaTime);
        
        // Exit defensive if HP recovered
        if (this.hp / this.maxHp > 0.7) {
            this.deactivateShield();
            this.defensiveMode = false;
            this.state = 'active';
        }
    }
    
    updateEnraged(deltaTime) {
        // Enraged constructs attack faster and use wrath ability
        if (!this.target) {
            this.state = 'returning';
            return;
        }
        
        // Use guardian wrath when available
        const now = Date.now();
        const wrath = this.abilities.guardianWrath;
        if (now - wrath.lastUsed >= wrath.cooldown) {
            this.useAbility('guardianWrath', this.target);
        }
        
        this.updateCombat(deltaTime);
    }
    
    updateSelfRepairing(deltaTime) {
        // Can't move or attack while repairing
        // Just wait for completion
    }
    
    updateReturning(deltaTime) {
        const distanceToGuard = this.getDistanceTo(this.guardPoint);
        
        if (distanceToGuard <= 10) {
            this.state = 'guarding';
            this.isAggressive = false;
            this.defensiveMode = false;
            this.threats.clear();
            this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.1); // Heal 10% on return
            console.log(`[AncientConstruct] ${this.id} returned to guard post`);
            return;
        }
        
        // Check for threats while returning
        if (this.target && this.getDistanceTo(this.target) <= this.aggroRange) {
            this.state = 'active';
            return;
        }
        
        this.moveToward(this.guardPoint, deltaTime);
    }
    
    // Abilities
    useAbility(abilityName, target) {
        const ability = this.abilities[abilityName];
        if (!ability) return false;
        
        const now = Date.now();
        if (now - ability.lastUsed < ability.cooldown) return false;
        
        // Check requirements
        if (ability.requiresEnrage && !this.enraged) return false;
        
        ability.lastUsed = now;
        
        switch (abilityName) {
            case 'energyBeam':
                this.performEnergyBeam(target, ability);
                break;
            case 'shieldMode':
                this.activateShield();
                break;
            case 'selfRepair':
                this.startSelfRepair();
                break;
            case 'guardianWrath':
                this.performGuardianWrath(target, ability);
                break;
        }
        
        return true;
    }
    
    performEnergyBeam(target, ability) {
        console.log(`[AncientConstruct] ${this.id} charging Energy Beam...`);
        
        // Charge time
        setTimeout(() => {
            if (this.hp <= 0) return;
            
            const damage = this.calculateDamage(ability.damage, target);
            this.dealDamage(target, damage, 'magic');
            
            this.emitCombatEvent('ability_used', {
                ability: 'energyBeam',
                target: target.id,
                damage,
                charged: true
            });
        }, ability.chargeTime);
    }
    
    activateShield() {
        if (this.shieldActive) return;
        
        this.shieldActive = true;
        this.defensiveMode = true;
        this.shieldEndTime = Date.now() + this.abilities.shieldMode.duration;
        
        console.log(`[AncientConstruct] ${this.id} activated Shield Mode`);
        
        this.emitCombatEvent('shield_activated', {
            duration: this.abilities.shieldMode.duration,
            damageReduction: this.abilities.shieldMode.damageReduction
        });
    }
    
    deactivateShield() {
        this.shieldActive = false;
        console.log(`[AncientConstruct] ${this.id} deactivated Shield Mode`);
        
        this.emitCombatEvent('shield_deactivated', {});
    }
    
    startSelfRepair() {
        if (this.selfRepairing) return;
        
        this.selfRepairing = true;
        this.state = 'selfRepairing';
        this.repairEndTime = Date.now() + this.abilities.selfRepair.channelTime;
        
        console.log(`[AncientConstruct] ${this.id} started Self Repair`);
        
        this.emitCombatEvent('repair_started', {
            channelTime: this.abilities.selfRepair.channelTime
        });
    }
    
    completeSelfRepair() {
        const repair = this.abilities.selfRepair;
        const healAmount = this.maxHp * repair.healPercent;
        this.hp = Math.min(this.maxHp, this.hp + healAmount);
        
        this.selfRepairing = false;
        this.defensiveMode = false;
        this.state = this.enraged ? 'enraged' : 'active';
        
        console.log(`[AncientConstruct] ${this.id} repaired ${Math.floor(healAmount)} HP`);
        
        this.emitCombatEvent('repair_complete', {
            healAmount: Math.floor(healAmount)
        });
    }
    
    performGuardianWrath(target, ability) {
        console.log(`[AncientConstruct] ${this.id} unleashes Guardian Wrath!`);
        
        // AoE damage around construct
        const damage = this.calculateDamage(ability.damage, target);
        
        // Damage all targets in range
        for (const [playerId, threat] of this.threats) {
            // Would look up actual player
            this.dealDamage({ id: playerId }, damage, 'physical');
        }
        
        // Knockback
        this.emitCombatEvent('ability_used', {
            ability: 'guardianWrath',
            damage,
            radius: ability.radius,
            knockback: ability.knockback
        });
    }
    
    enterEnrage() {
        this.enraged = true;
        this.state = 'enraged';
        this.attackSpeed *= 1.5; // Attack faster
        
        console.log(`[AncientConstruct] ${this.id} has become ENRAGED!`);
        
        this.emitCombatEvent('enrage', {
            message: 'The Ancient Construct enters a berserk rage!'
        });
    }
    
    // Combat methods
    updateCombat(deltaTime) {
        const now = Date.now();
        const distance = this.getDistanceTo(this.target);
        
        // Use energy beam at range
        if (distance <= this.abilities.energyBeam.range && distance > this.attackRange) {
            if (now - this.abilities.energyBeam.lastUsed >= this.abilities.energyBeam.cooldown) {
                this.useAbility('energyBeam', this.target);
                return;
            }
        }
        
        // Basic attack
        if (distance <= this.attackRange) {
            const attackDelay = 1000 / (this.attackSpeed * (this.enraged ? 1.5 : 1));
            if (now - this.lastAttackTime >= attackDelay) {
                this.attack(this.target);
            }
        } else {
            this.moveToward(this.target, deltaTime);
        }
    }
    
    attack(target) {
        this.lastAttackTime = Date.now();
        
        const damage = this.calculateDamage(this.damage, target);
        this.dealDamage(target, damage, 'physical');
        
        this.emitCombatEvent('attack', {
            target: target.id,
            damage
        });
    }
    
    calculateDamage(baseDamage, target) {
        let damage = baseDamage;
        
        if (target.resistances && target.resistances.physical !== undefined) {
            damage = damage * (1 - target.resistances.physical);
        }
        
        const variance = 0.9 + Math.random() * 0.2;
        damage = Math.floor(damage * variance);
        
        return Math.max(1, damage);
    }
    
    dealDamage(target, damage, type) {
        if (target.takeDamage) {
            target.takeDamage(damage, this.id, type);
        } else if (typeof target.hp === 'number') {
            target.hp = Math.max(0, target.hp - damage);
        }
    }
    
    takeDamage(damage, source, type = 'physical') {
        let resistance = this.resistances[type] || 0;
        
        // Shield mode reduces damage
        if (this.shieldActive) {
            damage = damage * (1 - this.abilities.shieldMode.damageReduction);
        }
        
        const finalDamage = Math.floor(damage * (1 - resistance));
        this.hp = Math.max(0, this.hp - finalDamage);
        
        // Add threat
        const currentThreat = this.threats.get(source.id || source) || 0;
        this.threats.set(source.id || source, currentThreat + finalDamage);
        
        // Interrupt self-repair if taking damage
        if (this.selfRepairing && finalDamage > 10) {
            this.selfRepairing = false;
            this.state = this.enraged ? 'enraged' : 'active';
            console.log(`[AncientConstruct] ${this.id} repair interrupted!`);
        }
        
        // Electric damage stuns briefly
        if (type === 'electric' && finalDamage > 0) {
            console.log(`[AncientConstruct] ${this.id} is stunned by electric damage!`);
        }
        
        // Become aggressive if attacked
        if (!this.isAggressive) {
            this.isAggressive = true;
            this.setTarget(source);
        }
        
        if (this.hp <= 0) {
            this.die(source);
        }
        
        return finalDamage;
    }
    
    die(killer) {
        this.hp = 0;
        this.state = 'dead';
        this.inCombat = false;
        
        console.log(`[AncientConstruct] ${this.id} destroyed by ${killer?.id || killer}`);
        
        const loot = this.generateLoot();
        
        this.emitCombatEvent('death', {
            killer: killer?.id || killer,
            loot,
            xp: this.xpValue,
            position: { x: this.x, y: this.y }
        });
        
        setTimeout(() => this.respawn(), this.respawnTime);
    }
    
    generateLoot() {
        const loot = [];
        for (const drop of this.drops) {
            if (Math.random() < drop.chance) {
                const amount = Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min;
                loot.push({ id: drop.id, name: drop.name, amount });
            }
        }
        return loot;
    }
    
    respawn() {
        this.hp = this.maxHp;
        this.state = 'guarding';
        this.x = this.guardPoint.x;
        this.y = this.guardPoint.y;
        this.target = null;
        this.inCombat = false;
        this.isAggressive = false;
        this.defensiveMode = false;
        this.enraged = false;
        this.shieldActive = false;
        this.selfRepairing = false;
        this.threats.clear();
        this.attackSpeed = 0.7; // Reset attack speed
        
        // Reset cooldowns
        Object.values(this.abilities).forEach(a => a.lastUsed = 0);
        
        console.log(`[AncientConstruct] ${this.id} respawned at guard post`);
    }
    
    moveToward(target, deltaTime) {
        const targetX = target.x ?? target.position?.x ?? this.x;
        const targetY = target.y ?? target.position?.y ?? this.y;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const moveDistance = this.moveSpeed * deltaTime;
            const ratio = Math.min(moveDistance / distance, 1);
            this.x += dx * ratio;
            this.y += dy * ratio;
        }
    }
    
    getDistanceTo(target) {
        const targetX = target.x ?? target.position?.x ?? this.x;
        const targetY = target.y ?? target.position?.y ?? this.y;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    setTarget(target) {
        this.target = target;
        if (!this.inCombat) {
            this.inCombat = true;
            this.combatStartTime = Date.now();
        }
    }
    
    loseTarget() {
        this.target = null;
        this.inCombat = false;
    }
    
    // Methods for treasure interaction
    onTreasureLootStarted(treasure, looter) {
        this.threats.set(looter.id || looter, 200); // High threat
        this.setTarget(looter);
        this.isAggressive = true;
        this.protectedTreasure = treasure;
        
        console.log(`[AncientConstruct] ${this.id} detects treasure being looted! Aggressive!`);
    }
    
    onTreasureLootStopped(looter) {
        this.threats.delete(looter.id || looter);
        
        if (this.target?.id === (looter.id || looter)) {
            if (this.threats.size > 0) {
                // Target next threat
            } else {
                this.loseTarget();
                this.state = 'returning';
            }
        }
    }
    
    emitCombatEvent(eventType, data) {
        console.log(`[AncientConstruct] Event: ${eventType}`, data);
    }
    
    getClientData() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            level: this.level,
            x: this.x,
            y: this.y,
            hp: this.hp,
            maxHp: this.maxHp,
            state: this.state,
            shieldActive: this.shieldActive,
            enraged: this.enraged,
            selfRepairing: this.selfRepairing,
            isAggressive: this.isAggressive
        };
    }
    
    getFullData() {
        return {
            ...this.getClientData(),
            damage: this.damage,
            attackSpeed: this.attackSpeed,
            moveSpeed: this.moveSpeed,
            regenRate: this.regenRate,
            aggroRange: this.aggroRange,
            behavior: this.behavior,
            resistances: this.resistances,
            abilities: Object.keys(this.abilities),
            xpValue: this.xpValue,
            inCombat: this.inCombat,
            threats: Array.from(this.threats.entries())
        };
    }
    
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

module.exports = AncientConstruct;
