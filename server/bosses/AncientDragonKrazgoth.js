/**
 * AncientDragonKrazgoth.js
 * 
 * Raid Boss for Draconia - Level 80
 * 5-phase encounter with increasing difficulty
 * Minimum 8-20 players recommended
 */

const EventEmitter = require('events');

class AncientDragonKrazgoth extends EventEmitter {
    constructor(id, zone = 'draconia') {
        super();
        this.id = id;
        this.type = 'ancient_dragon_krazgoth';
        this.name = 'Ancient Dragon Krazgoth';
        this.zone = zone;
        this.x = 4200;
        this.y = 2200;
        this.level = 80;
        this.maxHp = 2500000; // 2.5M HP
        this.hp = this.maxHp;
        this.damage = 350;
        this.armor = 150;
        this.moveSpeed = 60;
        this.attackRange = 80;
        this.aggroRange = 600;
        this.resistances = {
            fire: 0.9,
            ice: 0.7,
            physical: 0.5,
            magic: 0.6
        };
        
        // Phase system
        this.currentPhase = 1;
        this.maxPhases = 5;
        this.phaseThresholds = [0.8, 0.6, 0.4, 0.2, 0]; // HP % for phase changes
        this.inCombat = false;
        this.raidGroup = []; // Array of player IDs
        
        // Attack timers
        this.attackCooldown = 2000;
        this.lastAttackTime = 0;
        this.globalCooldown = 1500;
        this.lastAbilityTime = 0;
        
        // Phase abilities
        this.abilities = {
            // Phase 1: Initial
            fireBreath: { cooldown: 12000, lastUsed: 0, damage: 400, duration: 4000, range: 300 },
            tailSwipe: { cooldown: 8000, lastUsed: 0, damage: 250, knockback: 100, aoe: true },
            // Phase 2: Adds
            summonDrake: { cooldown: 30000, lastUsed: 0, count: 2 },
            wingBuffet: { cooldown: 15000, lastUsed: 0, damage: 200, pushDistance: 150 },
            // Phase 3: Enraged
            fireStorm: { cooldown: 25000, lastUsed: 0, damage: 150, duration: 8000, aoe: true },
            magmaPool: { cooldown: 18000, lastUsed: 0, damage: 100, duration: 10000, radius: 120 },
            // Phase 4: Desperate
            ancientRoar: { cooldown: 35000, lastUsed: 0, damage: 300, stunDuration: 3000, aoe: true },
            deathGrip: { cooldown: 20000, lastUsed: 0, damage: 500, execute: true },
            // Phase 5: Final
            worldEnder: { name: 'worldEnder', cooldown: 60000, lastUsed: 0, damage: 1000, castTime: 5000, interruptible: true }
        };
        
        // Enrage timer
        this.enrageTimer = 20 * 60 * 1000; // 20 minutes
        this.combatStartTime = null;
        this.isEnraged = false;
        this.isCasting = false;
        this.castEndTime = 0;
        
        // Adds tracking
        this.summonedDrakes = [];
        this.maxDrakes = 4;
        
        // Loot
        this.xpValue = 50000;
        this.lootTable = [
            { item: 'dragon_scale', chance: 1.0, quantity: [5, 10] },
            { item: 'krazgoth_fang', chance: 1.0, quantity: [2, 4] },
            { item: 'ancient_dragon_heart', chance: 0.8, quantity: 1 },
            { item: 'krazgoth_horn', chance: 0.6, quantity: [1, 2] },
            { item: 'dragonforge_ingot', chance: 0.5, quantity: [2, 5] },
            { item: 'krazgoth_claw', chance: 0.7, quantity: [2, 4] },
            { item: 'legendary_dragon_item', chance: 0.1, quantity: 1 }
        ];
        
        this.updateInterval = null;
        this.startUpdateLoop();
        this.onDeath = null;
    }
    
    startUpdateLoop() {
        this.updateInterval = setInterval(() => this.update(1), 1000);
    }
    
    update(deltaTime) {
        // Check phase transition
        this.checkPhaseTransition();
        
        // Check enrage
        if (this.inCombat && !this.isEnraged && this.combatStartTime) {
            if (Date.now() - this.combatStartTime > this.enrageTimer) {
                this.enrage();
            }
        }
        
        // Check casting
        if (this.isCasting && Date.now() >= this.castEndTime) {
            this.completeCast();
        }
        
        if (!this.inCombat) return;
        
        // Execute phase-specific logic
        this.executePhaseAbilities();
        
        // Basic attack if target exists and in range
        if (this.raidGroup.length > 0) {
            const target = this.getCurrentTarget();
            if (target) {
                const distance = this.getDistanceTo(target);
                if (distance <= this.attackRange) {
                    this.attack(target);
                }
            }
        }
    }
    
    checkPhaseTransition() {
        const hpPercent = this.hp / this.maxHp;
        const newPhase = this.getPhaseFromHp(hpPercent);
        
        if (newPhase !== this.currentPhase) {
            this.transitionToPhase(newPhase);
        }
    }
    
    getPhaseFromHp(hpPercent) {
        for (let i = 0; i < this.phaseThresholds.length; i++) {
            if (hpPercent > this.phaseThresholds[i]) {
                return i + 1;
            }
        }
        return this.maxPhases;
    }
    
    transitionToPhase(newPhase) {
        console.log(`[Krazgoth] Transitioning to Phase ${newPhase}`);
        this.currentPhase = newPhase;
        
        this.emit('phaseTransition', {
            bossId: this.id,
            phase: newPhase,
            hp: this.hp,
            maxHp: this.maxHp
        });
        
        // Phase-specific effects
        switch (newPhase) {
            case 2:
                this.emit('warning', { message: 'Krazgoth summons his drakes!' });
                break;
            case 3:
                this.damage = Math.floor(this.damage * 1.3);
                this.emit('warning', { message: 'Krazgoth enters a burning rage!' });
                break;
            case 4:
                this.emit('warning', { message: 'Krazgoth calls upon ancient powers!' });
                break;
            case 5:
                this.emit('warning', { message: 'Krazgoth prepares his final attack!' });
                break;
        }
    }
    
    executePhaseAbilities() {
        const now = Date.now();
        if (now - this.lastAbilityTime < this.globalCooldown) return;
        
        switch (this.currentPhase) {
            case 1:
                this.executePhase1Abilities();
                break;
            case 2:
                this.executePhase2Abilities();
                break;
            case 3:
                this.executePhase3Abilities();
                break;
            case 4:
                this.executePhase4Abilities();
                break;
            case 5:
                this.executePhase5Abilities();
                break;
        }
    }
    
    executePhase1Abilities() {
        const target = this.getCurrentTarget();
        if (!target) return;
        
        if (this.canUseAbility('fireBreath')) {
            this.useAbility('fireBreath', target);
        } else if (this.canUseAbility('tailSwipe')) {
            this.useAbility('tailSwipe');
        }
    }
    
    executePhase2Abilities() {
        if (this.summonedDrakes.length < this.maxDrakes && this.canUseAbility('summonDrake')) {
            this.useAbility('summonDrake');
        }
        
        const target = this.getCurrentTarget();
        if (target) {
            if (this.canUseAbility('fireBreath')) {
                this.useAbility('fireBreath', target);
            } else if (this.canUseAbility('wingBuffet')) {
                this.useAbility('wingBuffet');
            }
        }
    }
    
    executePhase3Abilities() {
        const target = this.getCurrentTarget();
        if (!target) return;
        
        if (this.canUseAbility('fireStorm')) {
            this.useAbility('fireStorm');
        } else if (this.canUseAbility('magmaPool')) {
            this.useAbility('magmaPool', target);
        } else if (this.canUseAbility('fireBreath')) {
            this.useAbility('fireBreath', target);
        }
    }
    
    executePhase4Abilities() {
        const target = this.getCurrentTarget();
        if (!target) return;
        
        if (this.canUseAbility('ancientRoar')) {
            this.useAbility('ancientRoar');
        } else if (this.canUseAbility('deathGrip')) {
            this.useAbility('deathGrip', target);
        } else if (this.canUseAbility('fireStorm')) {
            this.useAbility('fireStorm');
        }
    }
    
    executePhase5Abilities() {
        const target = this.getCurrentTarget();
        if (!target) return;
        
        if (this.canUseAbility('worldEnder') && !this.isCasting) {
            this.useAbility('worldEnder');
        } else if (this.canUseAbility('ancientRoar')) {
            this.useAbility('ancientRoar');
        } else if (this.canUseAbility('deathGrip')) {
            this.useAbility('deathGrip', target);
        }
    }
    
    canUseAbility(abilityName) {
        const ability = this.abilities[abilityName];
        if (!ability) return false;
        return Date.now() - ability.lastUsed >= ability.cooldown;
    }
    
    useAbility(abilityName, target = null) {
        const ability = this.abilities[abilityName];
        if (!ability || !this.canUseAbility(abilityName)) return false;
        if (this.isCasting && abilityName !== 'worldEnder') return false;
        
        ability.lastUsed = Date.now();
        this.lastAbilityTime = Date.now();
        
        switch (abilityName) {
            case 'fireBreath':
                this.emit('fireBreath', {
                    bossId: this.id,
                    x: this.x,
                    y: this.y,
                    direction: target ? { x: target.x - this.x, y: target.y - this.y } : { x: 1, y: 0 },
                    damage: ability.damage,
                    duration: ability.duration,
                    range: ability.range
                });
                break;
                
            case 'tailSwipe':
                this.emit('tailSwipe', {
                    bossId: this.id,
                    x: this.x,
                    y: this.y,
                    damage: ability.damage,
                    knockback: ability.knockback
                });
                break;
                
            case 'summonDrake':
                const count = ability.count || 2;
                this.emit('summonDrake', {
                    bossId: this.id,
                    count: count,
                    positions: this.generateDrakePositions(count)
                });
                break;
                
            case 'wingBuffet':
                this.emit('wingBuffet', {
                    bossId: this.id,
                    x: this.x,
                    y: this.y,
                    damage: ability.damage,
                    pushDistance: ability.pushDistance
                });
                break;
                
            case 'fireStorm':
                this.emit('fireStorm', {
                    bossId: this.id,
                    x: this.x,
                    y: this.y,
                    damage: ability.damage,
                    duration: ability.duration,
                    aoe: ability.aoe
                });
                break;
                
            case 'magmaPool':
                this.emit('magmaPool', {
                    bossId: this.id,
                    x: target?.x || this.x,
                    y: target?.y || this.y,
                    damage: ability.damage,
                    duration: ability.duration,
                    radius: ability.radius
                });
                break;
                
            case 'ancientRoar':
                this.emit('ancientRoar', {
                    bossId: this.id,
                    damage: ability.damage,
                    stunDuration: ability.stunDuration,
                    aoe: ability.aoe
                });
                break;
                
            case 'deathGrip':
                if (target) {
                    this.emit('deathGrip', {
                        bossId: this.id,
                        target: target.id,
                        damage: ability.damage,
                        execute: ability.execute
                    });
                }
                break;
                
            case 'worldEnder':
                this.startCasting(ability);
                break;
        }
        
        return true;
    }
    
    startCasting(ability) {
        this.isCasting = true;
        this.castEndTime = Date.now() + ability.castTime;
        this.currentCast = ability;
        
        this.emit('startCast', {
            bossId: this.id,
            ability: 'worldEnder',
            castTime: ability.castTime,
            interruptible: ability.interruptible
        });
    }
    
    completeCast() {
        if (this.currentCast && this.currentCast.name === 'worldEnder') {
            this.emit('worldEnder', {
                bossId: this.id,
                damage: this.currentCast.damage,
                aoe: true
            });
        }
        
        this.isCasting = false;
        this.currentCast = null;
    }
    
    interruptCast() {
        if (this.isCasting && this.currentCast && this.currentCast.interruptible) {
            this.isCasting = false;
            this.currentCast = null;
            this.emit('castInterrupted', { bossId: this.id });
            return true;
        }
        return false;
    }
    
    enrage() {
        this.isEnraged = true;
        this.damage = Math.floor(this.damage * 1.5);
        this.attackCooldown = Math.floor(this.attackCooldown * 0.7);
        
        this.emit('enrage', {
            bossId: this.id,
            message: 'Krazgoth has enraged!'
        });
    }
    
    startCombat(raidGroup) {
        this.inCombat = true;
        this.raidGroup = raidGroup || [];
        this.combatStartTime = Date.now();
        
        this.emit('combatStart', {
            bossId: this.id,
            raidSize: this.raidGroup.length,
            hp: this.hp,
            maxHp: this.maxHp
        });
    }
    
    endCombat() {
        this.inCombat = false;
        this.raidGroup = [];
        this.combatStartTime = null;
        this.isEnraged = false;
        
        // Despawn adds
        this.emit('despawnAdds', { bossId: this.id });
        
        this.emit('combatEnd', { bossId: this.id });
    }
    
    getCurrentTarget() {
        // Get tank (highest threat) or random if no threat system
        if (this.raidGroup.length === 0) return null;
        // In real implementation, would use threat table
        return { id: this.raidGroup[0], x: this.x + 100, y: this.y }; // Placeholder
    }
    
    generateDrakePositions(count) {
        const positions = [];
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            positions.push({
                x: this.x + Math.cos(angle) * 150,
                y: this.y + Math.sin(angle) * 150
            });
        }
        return positions;
    }
    
    attack(target) {
        const now = Date.now();
        if (now - this.lastAttackTime < this.attackCooldown) return;
        this.lastAttackTime = now;
        
        if (target && target.takeDamage) {
            let damage = this.damage;
            if (this.isEnraged) damage = Math.floor(damage * 1.5);
            
            damage = this.calculateDamage(damage, target);
            target.takeDamage(damage, this, 'physical');
            
            this.emit('attack', {
                bossId: this.id,
                target: target.id,
                damage: damage,
                enraged: this.isEnraged
            });
        }
    }
    
    calculateDamage(baseDamage, target) {
        let damage = baseDamage * (0.9 + Math.random() * 0.2);
        if (target.resistances) {
            damage *= (1 - (target.resistances.physical || 0));
        }
        return Math.floor(damage);
    }
    
    takeDamage(damage, source, type = 'physical') {
        if (!this.inCombat && source) {
            this.startCombat([source.id]);
        }
        
        if (this.resistances[type]) {
            damage *= (1 - this.resistances[type]);
        }
        
        damage = Math.max(1, Math.floor(damage));
        this.hp -= damage;
        
        this.emit('damageTaken', {
            bossId: this.id,
            damage: damage,
            hp: this.hp,
            maxHp: this.maxHp,
            source: source?.id,
            phase: this.currentPhase
        });
        
        if (this.hp <= 0) {
            this.die(source);
        }
        
        return damage;
    }
    
    die(source) {
        this.hp = 0;
        this.inCombat = false;
        this.endCombat();
        
        const loot = this.generateLoot();
        
        this.emit('death', {
            bossId: this.id,
            source: source?.id,
            loot: loot,
            xpValue: this.xpValue,
            raidGroup: this.raidGroup
        });
        
        if (this.onDeath) this.onDeath();
        this.cleanup();
    }
    
    generateLoot() {
        const loot = [];
        for (const item of this.lootTable) {
            if (Math.random() < item.chance) {
                let quantity = item.quantity;
                if (Array.isArray(quantity)) {
                    quantity = Math.floor(Math.random() * (quantity[1] - quantity[0] + 1)) + quantity[0];
                }
                loot.push({ item: item.item, quantity });
            }
        }
        return loot;
    }
    
    getDistanceTo(target) {
        if (!target || target.x === undefined || target.y === undefined) return Infinity;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getClientData() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            x: this.x,
            y: this.y,
            level: this.level,
            hp: this.hp,
            maxHp: this.maxHp,
            phase: this.currentPhase,
            isEnraged: this.isEnraged,
            isCasting: this.isCasting,
            castProgress: this.isCasting ? 
                (Date.now() - (this.castEndTime - this.currentCast.castTime)) / this.currentCast.castTime : 0
        };
    }
    
    getFullData() {
        return {
            ...this.getClientData(),
            damage: this.damage,
            armor: this.armor,
            resistances: this.resistances,
            raidGroup: this.raidGroup,
            inCombat: this.inCombat,
            enrageTimer: this.enrageTimer,
            combatTime: this.combatStartTime ? Date.now() - this.combatStartTime : 0
        };
    }
    
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.removeAllListeners();
    }
}

module.exports = AncientDragonKrazgoth;
