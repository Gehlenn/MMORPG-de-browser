/**
 * DesertBandit.js
 * 
 * Desert Bandit mob for Aurélia desert zone
 * Level 52, hit-and-run attacker that steals gold
 * Only active during the day
 */

class DesertBandit {
    constructor(id, position, zone) {
        this.id = id || `bandit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.type = 'desert_bandit';
        this.name = 'Desert Bandit';
        this.level = 52;
        
        // Position
        this.x = position?.x || 0;
        this.y = position?.y || 0;
        this.zone = zone || 'aurelia';
        this.subZone = position?.subZone || 'thief_valley';
        
        // Stats
        this.maxHp = 450;
        this.hp = this.maxHp;
        this.damage = 55;
        this.attackSpeed = 1.4;
        this.moveSpeed = 110; // Fast
        this.aggroRange = 200;
        this.attackRange = 35;
        this.leashRadius = 400;
        
        // Day/night cycle
        this.activeDuringDay = true;
        this.currentHour = new Date().getHours();
        this.isDaytime = this.currentHour >= 6 && this.currentHour < 18;
        this.state = this.isDaytime ? 'patrol' : 'resting';
        
        // Behavior
        this.behavior = 'hit_and_run';
        this.target = null;
        this.campPosition = { x: this.x, y: this.y };
        this.patrolRadius = 300;
        
        // Combat style
        this.hitAndRunDistance = 80; // Distance to run after attack
        this.attackCount = 0;
        this.maxAttacksBeforeRetreat = 3;
        
        // Special abilities
        this.abilities = {
            sandToss: {
                name: 'Sand Toss',
                cooldown: 10000,
                lastUsed: 0,
                blindDuration: 2500,
                description: 'Tosses sand in enemy eyes'
            },
            quickEscape: {
                name: 'Quick Escape',
                cooldown: 15000,
                lastUsed: 0,
                speedBoost: 1.5, // 50% faster
                duration: 3000,
                description: 'Temporary speed boost'
            },
            ambush: {
                name: 'Ambush',
                cooldown: 20000,
                lastUsed: 0,
                damage: this.damage * 1.5,
                requiresStealth: true,
                description: 'Surprise attack from hiding'
            },
            stealGold: {
                name: 'Steal Gold',
                cooldown: 0, // On every attack
                stealPercent: 0.02, // 2% of player gold per hit
                description: 'Steals gold on hit'
            }
        };
        
        // Combat state
        this.inCombat = false;
        this.combatStartTime = null;
        this.lastAttackTime = 0;
        this.targetsInAggro = new Set();
        
        // Stealth state
        this.isHidden = false;
        this.canAmbush = true;
        
        // Loot
        this.xpValue = 160;
        this.drops = [
            { id: 'stolen_water', name: 'Stolen Water', chance: 0.5, min: 1, max: 2 },
            { id: 'desert_dagger', name: 'Desert Dagger', chance: 0.3, min: 1, max: 1 },
            { id: 'bandit_mask', name: 'Bandit Mask', chance: 0.2, min: 1, max: 1 },
            { id: 'small_gold_pouch', name: 'Small Gold Pouch', chance: 0.4, min: 1, max: 3 }
        ];
        
        // Stolen gold (returns to player on death)
        this.stolenGold = 0;
        this.victims = new Set(); // Players stolen from
        
        // Resistances
        this.resistances = {
            physical: 0.15,
            fire: 0.1,
            poison: 0.3,
            cold: 0.2
        };
        
        // Spawn and despawn
        this.spawnTime = Date.now();
        this.respawnTime = 60000; // 60 seconds
        
        // Timers
        this.updateInterval = null;
        this.lastUpdate = Date.now();
        this.dayNightCheckInterval = null;
        
        this.initialize();
    }
    
    initialize() {
        console.log(`[DesertBandit] ${this.id} initialized at (${this.x}, ${this.y})`);
        this.startUpdateLoop();
        this.startDayNightCheck();
    }
    
    startUpdateLoop() {
        this.updateInterval = setInterval(() => this.update(), 200);
    }
    
    startDayNightCheck() {
        // Check day/night every minute
        this.dayNightCheckInterval = setInterval(() => {
            this.checkDayNight();
        }, 60000);
    }
    
    checkDayNight() {
        const hour = new Date().getHours();
        const isDay = hour >= 6 && hour < 18;
        
        if (isDay !== this.isDaytime) {
            this.isDaytime = isDay;
            
            if (isDay) {
                // Wake up
                if (this.state === 'resting') {
                    this.state = 'patrol';
                    this.x = this.campPosition.x;
                    this.y = this.campPosition.y;
                    console.log(`[DesertBandit] ${this.id} wakes up with the sun`);
                }
            } else {
                // Go rest
                if (this.state !== 'dead' && this.state !== 'resting') {
                    this.loseTarget();
                    this.state = 'returning';
                }
            }
        }
    }
    
    update() {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;
        
        // Skip update if resting or dead
        if (this.state === 'resting' || this.state === 'dead') return;
        
        // Update stealth
        this.updateStealth(deltaTime);
        
        // State machine
        switch (this.state) {
            case 'patrol':
                this.updatePatrol(deltaTime);
                break;
            case 'ambushing':
                this.updateAmbushing(deltaTime);
                break;
            case 'active':
                this.updateActive(deltaTime);
                break;
            case 'retreating':
                this.updateRetreating(deltaTime);
                break;
            case 'returning':
                this.updateReturning(deltaTime);
                break;
        }
    }
    
    updateStealth(deltaTime) {
        // Can hide if not in combat and stationary
        if (!this.inCombat && this.state === 'patrol') {
            // Random chance to hide
            if (Math.random() < 0.01) {
                this.isHidden = true;
                this.canAmbush = true;
            }
        } else if (this.inCombat) {
            this.isHidden = false;
            this.canAmbush = false;
        }
    }
    
    updatePatrol(deltaTime) {
        if (this.target) {
            // Check for ambush opportunity
            if (this.isHidden && this.canAmbush && this.getDistanceTo(this.target) <= this.aggroRange) {
                this.state = 'ambushing';
                return;
            }
            
            this.state = 'active';
            return;
        }
        
        // Random patrol
        const distanceToCamp = this.getDistanceTo(this.campPosition);
        
        if (distanceToCamp > this.patrolRadius) {
            // Return closer to camp
            const dx = this.campPosition.x - this.x;
            const dy = this.campPosition.y - this.y;
            const moveDistance = this.moveSpeed * deltaTime;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const ratio = Math.min(moveDistance / distance, 1);
                this.x += dx * ratio;
                this.y += dy * ratio;
            }
        } else {
            // Random movement
            if (Math.random() < 0.3) {
                const angle = Math.random() * Math.PI * 2;
                const moveDistance = this.moveSpeed * deltaTime * 0.5;
                this.x += Math.cos(angle) * moveDistance;
                this.y += Math.sin(angle) * moveDistance;
            }
        }
    }
    
    updateAmbushing(deltaTime) {
        if (!this.target) {
            this.state = 'patrol';
            return;
        }
        
        const distance = this.getDistanceTo(this.target);
        
        if (distance <= this.attackRange * 1.5) {
            // Perform ambush
            this.useAbility('ambush', this.target);
            this.canAmbush = false;
            this.isHidden = false;
            this.state = 'active';
        } else {
            // Move closer while hidden
            this.moveToward(this.target, deltaTime);
        }
    }
    
    updateActive(deltaTime) {
        if (!this.target) {
            this.state = 'returning';
            return;
        }
        
        const distance = this.getDistanceTo(this.target);
        const distanceFromCamp = this.getDistanceTo(this.campPosition);
        
        // Leash check
        if (distanceFromCamp > this.leashRadius) {
            this.loseTarget();
            this.state = 'returning';
            return;
        }
        
        // Check if should retreat after max attacks
        if (this.attackCount >= this.maxAttacksBeforeRetreat) {
            this.state = 'retreating';
            this.attackCount = 0;
            return;
        }
        
        // Combat
        this.updateCombat(deltaTime);
    }
    
    updateRetreating(deltaTime) {
        if (!this.target) {
            this.state = 'patrol';
            return;
        }
        
        // Run away from target
        const targetX = this.target.x ?? this.target.position?.x ?? this.x;
        const targetY = this.target.y ?? this.target.position?.y ?? this.y;
        
        const dx = this.x - targetX; // Run away
        const dy = this.y - targetY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const speed = this.moveSpeed * 1.3 * deltaTime; // Faster when retreating
            const ratio = Math.min(speed / distance, 1);
            this.x += dx * ratio;
            this.y += dy * ratio;
        }
        
        // Use quick escape if available
        const now = Date.now();
        if (now - this.abilities.quickEscape.lastUsed >= this.abilities.quickEscape.cooldown) {
            this.useAbility('quickEscape');
        }
        
        // Stop retreating when far enough
        if (this.getDistanceTo(this.target) >= this.hitAndRunDistance * 1.5) {
            this.state = 'active';
        }
    }
    
    updateReturning(deltaTime) {
        const distanceToCamp = this.getDistanceTo(this.campPosition);
        
        if (distanceToCamp <= 10) {
            if (!this.isDaytime) {
                this.state = 'resting';
                console.log(`[DesertBandit] ${this.id} is now resting for the night`);
            } else {
                this.state = 'patrol';
            }
            this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.2); // Heal on return
            return;
        }
        
        // Check for targets while returning
        if (this.target && this.getDistanceTo(this.target) <= this.aggroRange) {
            this.state = 'active';
            return;
        }
        
        this.moveToward(this.campPosition, deltaTime);
    }
    
    updateCombat(deltaTime) {
        const now = Date.now();
        const distance = this.getDistanceTo(this.target);
        
        // Use sand toss when in close
        if (distance <= this.attackRange && Math.random() < 0.3) {
            if (now - this.abilities.sandToss.lastUsed >= this.abilities.sandToss.cooldown) {
                this.useAbility('sandToss', this.target);
            }
        }
        
        // Basic attack
        if (distance <= this.attackRange) {
            if (now - this.lastAttackTime >= (1000 / this.attackSpeed)) {
                this.attack(this.target);
                this.attackCount++;
            }
        } else {
            this.moveToward(this.target, deltaTime);
        }
    }
    
    // Abilities
    useAbility(abilityName, target = null) {
        const ability = this.abilities[abilityName];
        if (!ability) return false;
        
        const now = Date.now();
        if (now - ability.lastUsed < ability.cooldown) return false;
        
        ability.lastUsed = now;
        
        switch (abilityName) {
            case 'sandToss':
                this.performSandToss(target, ability);
                break;
            case 'quickEscape':
                this.performQuickEscape(ability);
                break;
            case 'ambush':
                this.performAmbush(target, ability);
                break;
        }
        
        return true;
    }
    
    performSandToss(target, ability) {
        console.log(`[DesertBandit] ${this.id} tosses sand at ${target.id || target}`);
        
        if (target.applyStatusEffect) {
            target.applyStatusEffect({
                type: 'blind',
                duration: ability.blindDuration,
                source: this.id
            });
        }
        
        this.emitCombatEvent('ability_used', {
            ability: 'sandToss',
            target: target.id,
            blindDuration: ability.blindDuration
        });
    }
    
    performQuickEscape(ability) {
        console.log(`[DesertBandit] ${this.id} uses Quick Escape!`);
        
        // Speed boost applied in movement
        this.emitCombatEvent('ability_used', {
            ability: 'quickEscape',
            speedBoost: ability.speedBoost,
            duration: ability.duration
        });
    }
    
    performAmbush(target, ability) {
        console.log(`[DesertBandit] ${this.id} performs Ambush on ${target.id || target}!`);
        
        const damage = this.calculateDamage(ability.damage, target);
        this.dealDamage(target, damage, 'physical');
        
        // Extra gold steal on ambush
        const stolen = this.stealGold(target, 0.05); // 5% on ambush
        
        this.emitCombatEvent('ambush', {
            target: target.id,
            damage,
            stolenGold: stolen
        });
    }
    
    // Combat methods
    attack(target) {
        this.lastAttackTime = Date.now();
        
        const damage = this.calculateDamage(this.damage, target);
        this.dealDamage(target, damage, 'physical');
        
        // Steal gold
        const stolen = this.stealGold(target);
        
        this.emitCombatEvent('attack', {
            target: target.id,
            damage,
            stolenGold: stolen
        });
    }
    
    stealGold(target, overridePercent = null) {
        const percent = overridePercent || this.abilities.stealGold.stealPercent;
        
        // Check if target has gold
        if (target.gold && target.gold > 0) {
            const stealAmount = Math.floor(target.gold * percent);
            
            if (stealAmount > 0) {
                target.gold -= stealAmount;
                this.stolenGold += stealAmount;
                this.victims.add(target.id || target);
                
                console.log(`[DesertBandit] ${this.id} stole ${stealAmount} gold from ${target.id || target}`);
                
                // Notify player
                if (target.notify) {
                    target.notify({
                        type: 'gold_stolen',
                        amount: stealAmount,
                        by: this.name
                    });
                }
                
                return stealAmount;
            }
        }
        
        return 0;
    }
    
    calculateDamage(baseDamage, target) {
        let damage = baseDamage;
        
        if (target.resistances && target.resistances.physical !== undefined) {
            damage = damage * (1 - target.resistances.physical);
        }
        
        // Ambush bonus if hidden
        if (this.isHidden) {
            damage *= 1.5;
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
        const resistance = this.resistances[type] || 0;
        const finalDamage = Math.floor(damage * (1 - resistance));
        
        this.hp = Math.max(0, this.hp - finalDamage);
        
        // Reveal if hidden
        if (this.isHidden) {
            this.isHidden = false;
            console.log(`[DesertBandit] ${this.id} revealed by damage!`);
        }
        
        if (!this.target) {
            this.setTarget(source);
        }
        
        // Try to escape if low HP
        if (this.hp / this.maxHp < 0.3 && this.state !== 'retreating') {
            this.state = 'retreating';
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
        
        console.log(`[DesertBandit] ${this.id} killed by ${killer?.id || killer}`);
        
        // Return stolen gold to victims
        if (this.stolenGold > 0) {
            console.log(`[DesertBandit] ${this.id} drops ${this.stolenGold} stolen gold`);
        }
        
        const loot = this.generateLoot();
        
        this.emitCombatEvent('death', {
            killer: killer?.id || killer,
            loot,
            xp: this.xpValue,
            position: { x: this.x, y: this.y },
            returnedGold: this.stolenGold,
            victims: Array.from(this.victims)
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
        
        // Add stolen gold as loot
        if (this.stolenGold > 0) {
            loot.push({ id: 'stolen_gold', name: 'Stolen Gold', amount: this.stolenGold });
        }
        
        return loot;
    }
    
    respawn() {
        this.hp = this.maxHp;
        this.state = this.isDaytime ? 'patrol' : 'resting';
        this.x = this.campPosition.x;
        this.y = this.campPosition.y;
        this.target = null;
        this.inCombat = false;
        this.attackCount = 0;
        this.isHidden = false;
        this.canAmbush = true;
        this.stolenGold = 0;
        this.victims.clear();
        
        Object.values(this.abilities).forEach(a => a.lastUsed = 0);
        
        console.log(`[DesertBandit] ${this.id} respawned`);
    }
    
    moveToward(target, deltaTime) {
        const targetX = target.x ?? target.position?.x ?? this.x;
        const targetY = target.y ?? target.position?.y ?? this.y;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            let speed = this.moveSpeed;
            
            // Quick escape speed boost
            const now = Date.now();
            if (now - this.abilities.quickEscape.lastUsed < this.abilities.quickEscape.duration) {
                speed *= this.abilities.quickEscape.speedBoost;
            }
            
            const moveDistance = speed * deltaTime;
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
        this.attackCount = 0;
    }
    
    addToAggro(player) {
        this.targetsInAggro.add(player.id || player);
        if (!this.target && this.isDaytime) this.setTarget(player);
    }
    
    removeFromAggro(player) {
        this.targetsInAggro.delete(player.id || player);
        if (this.target?.id === (player.id || player)) {
            if (this.targetsInAggro.size > 0) {
                const newTargetId = this.targetsInAggro.values().next().value;
            } else {
                this.loseTarget();
                this.state = 'returning';
            }
        }
    }
    
    emitCombatEvent(eventType, data) {
        console.log(`[DesertBandit] Event: ${eventType}`, data);
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
            isHidden: this.isHidden,
            isDaytime: this.isDaytime,
            stolenGold: this.stolenGold
        };
    }
    
    getFullData() {
        return {
            ...this.getClientData(),
            damage: this.damage,
            attackSpeed: this.attackSpeed,
            moveSpeed: this.moveSpeed,
            aggroRange: this.aggroRange,
            behavior: this.behavior,
            resistances: this.resistances,
            abilities: Object.keys(this.abilities),
            xpValue: this.xpValue,
            inCombat: this.inCombat,
            attackCount: this.attackCount
        };
    }
    
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        if (this.dayNightCheckInterval) {
            clearInterval(this.dayNightCheckInterval);
            this.dayNightCheckInterval = null;
        }
    }
}

module.exports = DesertBandit;
